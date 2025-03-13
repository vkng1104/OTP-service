import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PageableRequest {
  /**
   * The page number to retrieve.
   * Should be a non-negative integer.
   * Default value is 0.
   */
  @IsOptional()
  @Type(() => Number) // Ensures proper transformation from query params
  @IsInt()
  @Min(0)
  page?: number = 0;

  /**
   * The number of items to include in each page.
   * Should be a positive integer between 1 and 200 (inclusive).
   * Default value is 20.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  size?: number = 20;

  /**
   * Returns the computed page number.
   */
  getPage(): number {
    return this.page ?? 0;
  }

  /**
   * Returns the computed page size.
   */
  getSize(): number {
    return this.size ?? 20;
  }

  /**
   * Computes the `LIMIT` value for database queries.
   */
  limit(): number {
    return Math.max(this.getSize(), 1);
  }

  /**
   * Computes the `OFFSET` value for database queries.
   */
  offset(): number {
    return this.getPage() * this.limit();
  }
}
