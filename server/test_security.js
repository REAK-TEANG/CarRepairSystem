import { DEFAULT_PERMISSIONS_MATRIX } from './middleware/auth.js'

const BASE_URL = 'http://localhost:5000/api'

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  let body = null
  try {
    body = await res.json()
  } catch {
    body = await res.text()
  }

  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body,
  }
}

async function runSecurityTests() {
  console.log('====================================================')
  console.log('🛡️  STARTING COMPREHENSIVE TEST SUITE')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? `-> ${details}` : ''}`)
      failed++
    }
  }

  try {
    // 1. Health Check
    console.log('--- 1. Testing Health & Server Availability ---')
    const health = await makeRequest('/health')
    assert(health.status === 200, 'GET /api/health responds with 200 OK')
    assert(health.headers['x-content-type-options'] === 'nosniff', 'Helmet security headers present')

    // 2. Authentication: Login Failure
    console.log('\n--- 2. Testing Authentication Failures ---')
    const badLogin = await makeRequest('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'wrongpassword' },
    })
    assert(badLogin.status === 401, 'Invalid password returns 401 Unauthorized')

    const emptyLogin = await makeRequest('/auth/login', {
      method: 'POST',
      body: {},
    })
    assert(emptyLogin.status === 400, 'Empty credentials returns 400 Bad Request')

    // 3. Authentication: Login Success & Real JWT Tokens
    console.log('\n--- 3. Testing Authentication Success & JWT Issuance ---')
    const adminLogin = await makeRequest('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'password123' },
    })
    assert(adminLogin.status === 200, 'Admin login with password123 returns 200 OK')
    assert(Boolean(adminLogin.body?.token), 'Admin login returns signed JWT token')
    const adminToken = adminLogin.body?.token

    // Ensure permissions matrix is in clean default state
    await makeRequest('/settings/permissions', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: DEFAULT_PERMISSIONS_MATRIX,
    })

    // Test Quick Login for other roles
    const mechLogin = await makeRequest('/auth/quick-login', {
      method: 'POST',
      body: { role: 'mechanic' },
    })
    assert(mechLogin.status === 200, 'Mechanic quick-login returns 200 OK')
    const mechToken = mechLogin.body?.token

    const cashierLogin = await makeRequest('/auth/quick-login', {
      method: 'POST',
      body: { role: 'cashier' },
    })
    assert(cashierLogin.status === 200, 'Cashier quick-login returns 200 OK')
    const cashierToken = cashierLogin.body?.token

    const storeLogin = await makeRequest('/auth/quick-login', {
      method: 'POST',
      body: { role: 'storekeeper' },
    })
    assert(storeLogin.status === 200, 'Storekeeper quick-login returns 200 OK')
    const storeToken = storeLogin.body?.token

    // 4. Testing Protected Endpoints without Token
    console.log('\n--- 4. Testing Route Protection (Unauthenticated Access) ---')
    const unauthCustomers = await makeRequest('/customers')
    assert(unauthCustomers.status === 401, 'GET /customers without token rejected with 401')

    const unauthEmployees = await makeRequest('/employees')
    assert(unauthEmployees.status === 401, 'GET /employees without token rejected with 401')

    const unauthInvoices = await makeRequest('/invoices')
    assert(unauthInvoices.status === 401, 'GET /invoices without token rejected with 401')

    const unauthInventory = await makeRequest('/inventory')
    assert(unauthInventory.status === 401, 'GET /inventory without token rejected with 401')

    // 5. Testing Protected Endpoints with Forged / Invalid Token
    console.log('\n--- 5. Testing Forged & Tampered Tokens ---')
    const forgedRequest = await makeRequest('/customers', {
      headers: { Authorization: 'Bearer forged.invalid.token.12345' },
    })
    assert(forgedRequest.status === 401, 'Forged JWT token rejected with 401 InvalidToken')

    // 6. Testing /api/auth/me
    console.log('\n--- 6. Testing /api/auth/me Token Verification ---')
    const adminMe = await makeRequest('/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert(adminMe.status === 200, 'GET /auth/me with Admin token returns 200 OK')
    assert(adminMe.body?.user?.role === 'admin', 'Admin token correctly identifies admin role')

    const mechMe = await makeRequest('/auth/me', {
      headers: { Authorization: `Bearer ${mechToken}` },
    })
    assert(mechMe.status === 200, 'GET /auth/me with Mechanic token returns 200 OK')
    assert(mechMe.body?.user?.role === 'mechanic', 'Mechanic token correctly identifies mechanic role')

    // 7. Testing RBAC Role Permissions
    console.log('\n--- 7. Testing Dynamic RBAC Role Authorization ---')
    const adminCust = await makeRequest('/customers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert(adminCust.status === 200, 'Admin can read /customers (200 OK)')

    const mechJobs = await makeRequest('/repair-jobs', {
      headers: { Authorization: `Bearer ${mechToken}` },
    })
    assert(mechJobs.status === 200, 'Mechanic can read /repair-jobs (200 OK)')

    const mechDeleteCust = await makeRequest('/customers/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mechToken}` },
    })
    assert(mechDeleteCust.status === 403, 'Mechanic deleting customer blocked with 403 Forbidden')

    const mechCreateEmp = await makeRequest('/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mechToken}` },
      body: { name: 'Unauthorized Staff' },
    })
    assert(mechCreateEmp.status === 403, 'Mechanic creating employee blocked with 403 Forbidden')

    const cashierInvoices = await makeRequest('/invoices', {
      headers: { Authorization: `Bearer ${cashierToken}` },
    })
    assert(cashierInvoices.status === 200, 'Cashier can read /invoices (200 OK)')

    const cashierDeleteInv = await makeRequest('/inventory/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cashierToken}` },
    })
    assert(cashierDeleteInv.status === 403, 'Cashier deleting inventory blocked with 403 Forbidden')

    const storeInventory = await makeRequest('/inventory', {
      headers: { Authorization: `Bearer ${storeToken}` },
    })
    assert(storeInventory.status === 200, 'Storekeeper can read /inventory (200 OK)')

    const storeDeleteCust = await makeRequest('/customers/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${storeToken}` },
    })
    assert(storeDeleteCust.status === 403, 'Storekeeper deleting customer blocked with 403 Forbidden')

    // 8. Testing Service Catalog Bill of Materials & Required Parts
    console.log('\n--- 8. Testing Services Bill of Materials (BOM) ---')
    const servicesRes = await makeRequest('/services', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert(servicesRes.status === 200, 'GET /services responds with 200 OK')
    const oilService = servicesRes.body?.data?.find((s) => s.name.includes('Oil'))
    assert(Boolean(oilService), 'Found Oil Service in catalog')
    assert(Array.isArray(oilService?.requiredParts) && oilService.requiredParts.length > 0, 'Oil Service has required spare parts configured')

    // 9. Testing Automatic Stock-Out on Repair Job Creation
    console.log('\n--- 9. Testing Auto Stock-Out on Repair Job Creation ---')
    const partsBefore = await makeRequest('/spare-parts', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const filterPartBefore = partsBefore.body?.data?.find((p) => p.partCode === 'OF-1044')
    const stockQtyBefore = filterPartBefore?.stockQty || 0

    const newJobRes = await makeRequest('/repair-orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        customerId: 1,
        vehicleId: 1,
        mechanicId: 1,
        problem: 'Oil replacement test',
        serviceId: oilService?.id || 1,
        estimatedCost: '$85.00',
        status: 'Repairing',
      },
    })
    assert(newJobRes.status === 201, 'POST /repair-orders with Service created successfully')

    const partsAfter = await makeRequest('/spare-parts', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const filterPartAfter = partsAfter.body?.data?.find((p) => p.partCode === 'OF-1044')
    assert(filterPartAfter?.stockQty === stockQtyBefore - 1, `Auto stock-out decremented stock: ${stockQtyBefore} -> ${filterPartAfter?.stockQty}`)

    // 10. Testing Inventory Transactions Audit Trail
    console.log('\n--- 10. Testing Inventory Transaction Audit Logging ---')
    const txsRes = await makeRequest('/spare-parts/transactions', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert(txsRes.status === 200, 'GET /spare-parts/transactions responds with 200 OK')
    const latestTx = txsRes.body?.data?.[0]
    assert(latestTx?.type === 'Stock Out', `Latest transaction is Stock Out (${latestTx?.notes})`)

    console.log('\n====================================================')
    console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`)
    console.log('====================================================')

    if (failed > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }
  } catch (err) {
    console.error('Test execution error:', err)
    process.exit(1)
  }
}

runSecurityTests()
