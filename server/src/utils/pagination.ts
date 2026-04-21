import { Request } from "express";

export function getPagination(req: Request) {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function paginatedResponse<T>({
  data,
  total,
  page,
  limit,
}: {
  data: T[];
  total: number;
  page: number;
  limit: number;
}) {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}