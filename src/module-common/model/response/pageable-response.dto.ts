/**
 * A generic class representing a pageable response.
 *
 * @template T The type of items in the paginated response.
 */
export class PageableResponse<T> {
  /**
   * The total number of items that satisfy the request.
   */
  readonly count: number;

  /**
   * The list of items returned in the response.
   */
  readonly data: T[];

  constructor(count: number, data: T[]) {
    this.count = count;
    this.data = data;
  }
}
