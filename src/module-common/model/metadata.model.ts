export class Metadata {
  private data: Map<string, unknown>;

  constructor(initialData: Record<string, unknown> = {}) {
    this.data = new Map(Object.entries(initialData));
  }

  static async fromData(data?: string | Blob | JSON | null): Promise<Metadata> {
    if (!data) return new Metadata({});

    let finalData: Record<string, unknown>;
    if (typeof data === "string") {
      finalData = JSON.parse(data);
    } else if (data instanceof Blob) {
      finalData = JSON.parse(
        new TextDecoder().decode(await data.arrayBuffer()),
      );
    } else if (typeof data === "object" && data !== null) {
      finalData = Object.fromEntries(Object.entries(data));
    } else {
      finalData = {};
    }
    return new Metadata(finalData);
  }

  /**
   * Removes all null and undefined values from the metadata
   * @returns A new Metadata instance with null values removed
   */
  removeNullValues(): Metadata {
    const cleanData: Record<string, unknown> = {};
    this.data.forEach((value, key) => {
      if (value != null) {
        cleanData[key] = value;
      }
    });
    return new Metadata(cleanData);
  }

  /**
   * Gets a string value from the metadata
   * @param key The key to look up
   * @param defaultValue Optional default value if key doesn't exist or value is null
   * @returns The string value or defaultValue
   */
  getString(key: string, defaultValue?: string): string | undefined {
    const value = this.data.get(key);
    if (value == null) return defaultValue;
    return String(value);
  }

  /**
   * Gets a number value from the metadata
   * @param key The key to look up
   * @param defaultValue Optional default value if key doesn't exist or value is null
   * @returns The number value or defaultValue
   */
  getNumber(key: string, defaultValue?: number): number | undefined {
    const value = this.data.get(key);
    if (value == null) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Gets a boolean value from the metadata
   * @param key The key to look up
   * @param defaultValue Optional default value if key doesn't exist or value is null
   * @returns The boolean value or defaultValue
   */
  getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
    const value = this.data.get(key);
    if (value == null) return defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lowercased = value.toLowerCase();
      if (lowercased === "true") return true;
      if (lowercased === "false") return false;
    }
    return defaultValue;
  }

  /**
   * Gets a nested Metadata object from the metadata
   * @param key The key to look up
   * @param defaultValue Optional default value if key doesn't exist or value is null
   * @returns A new Metadata instance or defaultValue
   */
  getMetadata(key: string, defaultValue?: Metadata): Metadata | undefined {
    const value = this.data.get(key);
    if (value == null) return defaultValue;
    if (value instanceof Metadata) return value;
    if (typeof value === "object" && value !== null) {
      return new Metadata(value as Record<string, unknown>);
    }
    return defaultValue;
  }

  /**
   * Sets a value in the metadata
   * @param key The key to set
   * @param value The value to set
   * @returns The Metadata instance for chaining
   */
  set(key: string, value: unknown): Metadata {
    this.data.set(key, value);
    return this;
  }

  /**
   * Gets a value from the metadata
   * @param key The key to look up
   * @returns The value or undefined if not found
   */
  get(key: string): unknown {
    return this.data.get(key);
  }

  /**
   * Checks if a key exists in the metadata
   * @param key The key to check
   * @returns true if the key exists
   */
  has(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * Deletes a key from the metadata
   * @param key The key to delete
   * @returns true if the key was deleted
   */
  delete(key: string): boolean {
    return this.data.delete(key);
  }

  /**
   * Clears all data from the metadata
   */
  clear(): void {
    this.data.clear();
  }

  /**
   * Gets all entries as a plain object
   * @returns A plain object containing all metadata
   */
  toObject(): Record<string, unknown> {
    return Object.fromEntries(this.data);
  }

  toBlob(): Blob {
    return new Blob([JSON.stringify(this.toObject())], {
      type: "application/json",
    });
  }

  /**
   * Gets all keys in the metadata
   * @returns An array of all keys
   */
  keys(): string[] {
    return Array.from(this.data.keys());
  }

  /**
   * Gets all values in the metadata
   * @returns An array of all values
   */
  values(): unknown[] {
    return Array.from(this.data.values());
  }

  /**
   * Gets all entries in the metadata
   * @returns An array of all [key, value] pairs
   */
  entries(): [string, unknown][] {
    return Array.from(this.data.entries());
  }
}
