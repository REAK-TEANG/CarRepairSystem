<?php
// api/utils/pagination.php

class Pagination
{
    /**
     * Parse page and limit from query parameters.
     * Default page = 1, default limit = 10, max limit = 100.
     * If ?all=true or ?all=1 is supplied, isAll will be true.
     */
    public static function getParams(int $defaultLimit = 10): array
    {
        $rawAll = $_GET['all'] ?? null;
        $isAll = $rawAll === 'true' || $rawAll === '1' || $rawAll === 1 || $rawAll === true;

        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int) ($_GET['limit'] ?? $defaultLimit)));
        $offset = ($page - 1) * $limit;

        return [
            'isAll' => $isAll,
            'page' => $page,
            'limit' => $limit,
            'offset' => $offset,
        ];
    }

    /**
     * Format standard paginated JSON structure
     */
    public static function formatResponse(array $data, int $total, int $page, int $limit): array
    {
        $totalPages = $total > 0 ? (int) ceil($total / $limit) : 1;

        return [
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $totalPages,
                'hasNextPage' => $page < $totalPages,
                'hasPrevPage' => $page > 1,
            ],
        ];
    }
}
