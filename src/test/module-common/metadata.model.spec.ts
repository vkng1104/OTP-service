import { Metadata } from "~/module-common/model/metadata.model";

describe("Metadata", () => {
  describe("constructor", () => {
    it("should create an empty Metadata instance when no initial data is provided", () => {
      const metadata = new Metadata();
      expect(metadata.toObject()).toEqual({});
    });

    it("should create a Metadata instance with initial data", () => {
      const initialData = {
        name: "John",
        age: 30,
        isActive: true,
        settings: { theme: "dark" },
      };
      const metadata = new Metadata(initialData);
      expect(metadata.toObject()).toEqual(initialData);
    });
  });

  describe("removeNullValues", () => {
    it("should remove null and undefined values", () => {
      const metadata = new Metadata({
        name: "John",
        age: null,
        isActive: true,
        email: undefined,
      });
      const cleanMetadata = metadata.removeNullValues();
      expect(cleanMetadata.toObject()).toEqual({
        name: "John",
        isActive: true,
      });
    });

    it("should return a new instance without modifying the original", () => {
      const metadata = new Metadata({
        name: "John",
        age: null,
      });
      const cleanMetadata = metadata.removeNullValues();
      expect(metadata.toObject()).toEqual({
        name: "John",
        age: null,
      });
      expect(cleanMetadata.toObject()).toEqual({
        name: "John",
      });
    });
  });

  describe("getString", () => {
    it("should return string values as is", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.getString("name")).toBe("John");
    });

    it("should convert non-string values to strings", () => {
      const metadata = new Metadata({
        number: 42,
        boolean: true,
        object: { key: "value" },
      });
      expect(metadata.getString("number")).toBe("42");
      expect(metadata.getString("boolean")).toBe("true");
      expect(metadata.getString("object")).toBe("[object Object]");
    });

    it("should return default value when key does not exist", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.getString("age", "unknown")).toBe("unknown");
    });

    it("should return default value when value is null", () => {
      const metadata = new Metadata({ name: null });
      expect(metadata.getString("name", "unknown")).toBe("unknown");
    });

    it("should return undefined when key does not exist and no default is provided", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.getString("age")).toBeUndefined();
    });
  });

  describe("getNumber", () => {
    it("should return number values as is", () => {
      const metadata = new Metadata({ age: 42 });
      expect(metadata.getNumber("age")).toBe(42);
    });

    it("should convert string numbers to numbers", () => {
      const metadata = new Metadata({ age: "42" });
      expect(metadata.getNumber("age")).toBe(42);
    });

    it("should return default value when key does not exist", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.getNumber("age", 0)).toBe(0);
    });

    it("should return default value when value is null", () => {
      const metadata = new Metadata({ age: null });
      expect(metadata.getNumber("age", 0)).toBe(0);
    });

    it("should return default value when value is not a valid number", () => {
      const metadata = new Metadata({ age: "not a number" });
      expect(metadata.getNumber("age", 0)).toBe(0);
    });

    it("should return undefined when key does not exist and no default is provided", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.getNumber("age")).toBeUndefined();
    });
  });

  describe("getBoolean", () => {
    it("should return boolean values as is", () => {
      const metadata = new Metadata({ isActive: true });
      expect(metadata.getBoolean("isActive")).toBe(true);
    });

    it("should convert string 'true' to true", () => {
      const metadata = new Metadata({ isActive: "true" });
      expect(metadata.getBoolean("isActive")).toBe(true);
    });

    it("should convert string 'false' to false", () => {
      const metadata = new Metadata({ isActive: "false" });
      expect(metadata.getBoolean("isActive")).toBe(false);
    });

    it("should convert string 'TRUE' to true (case insensitive)", () => {
      const metadata = new Metadata({ isActive: "TRUE" });
      expect(metadata.getBoolean("isActive")).toBe(true);
    });

    it("should convert string 'FALSE' to false (case insensitive)", () => {
      const metadata = new Metadata({ isActive: "FALSE" });
      expect(metadata.getBoolean("isActive")).toBe(false);
    });

    it("should return default value when key does not exist", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.getBoolean("isActive", false)).toBe(false);
    });

    it("should return default value when value is null", () => {
      const metadata = new Metadata({ isActive: null });
      expect(metadata.getBoolean("isActive", false)).toBe(false);
    });

    it("should return default value when value is not a valid boolean", () => {
      const metadata = new Metadata({ isActive: "not a boolean" });
      expect(metadata.getBoolean("isActive", false)).toBe(false);
    });

    it("should return undefined when key does not exist and no default is provided", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.getBoolean("isActive")).toBeUndefined();
    });
  });

  describe("getMetadata", () => {
    it("should return Metadata instances as is", () => {
      const nestedMetadata = new Metadata({ theme: "dark" });
      const metadata = new Metadata({ settings: nestedMetadata });
      expect(metadata.getMetadata("settings")).toBe(nestedMetadata);
    });

    it("should convert plain objects to Metadata instances", () => {
      const metadata = new Metadata({ settings: { theme: "dark" } });
      const result = metadata.getMetadata("settings");
      expect(result).toBeInstanceOf(Metadata);
      expect(result?.toObject()).toEqual({ theme: "dark" });
    });

    it("should return default value when key does not exist", () => {
      const metadata = new Metadata({ name: "John" });
      const defaultValue = new Metadata({ default: true });
      expect(metadata.getMetadata("settings", defaultValue)).toBe(defaultValue);
    });

    it("should return default value when value is null", () => {
      const metadata = new Metadata({ settings: null });
      const defaultValue = new Metadata({ default: true });
      expect(metadata.getMetadata("settings", defaultValue)).toBe(defaultValue);
    });

    it("should return default value when value is not an object", () => {
      const metadata = new Metadata({ settings: "not an object" });
      const defaultValue = new Metadata({ default: true });
      expect(metadata.getMetadata("settings", defaultValue)).toBe(defaultValue);
    });

    it("should return undefined when key does not exist and no default is provided", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.getMetadata("settings")).toBeUndefined();
    });
  });

  describe("set", () => {
    it("should set a value and return the instance for chaining", () => {
      const metadata = new Metadata();
      const result = metadata.set("name", "John");
      expect(metadata.getString("name")).toBe("John");
      expect(result).toBe(metadata);
    });

    it("should overwrite existing values", () => {
      const metadata = new Metadata({ name: "John" });
      metadata.set("name", "Jane");
      expect(metadata.getString("name")).toBe("Jane");
    });
  });

  describe("get", () => {
    it("should return the value as is", () => {
      const metadata = new Metadata({ name: "John", age: 30 });
      expect(metadata.get("name")).toBe("John");
      expect(metadata.get("age")).toBe(30);
    });

    it("should return undefined when key does not exist", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.get("age")).toBeUndefined();
    });
  });

  describe("has", () => {
    it("should return true when key exists", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.has("name")).toBe(true);
    });

    it("should return false when key does not exist", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.has("age")).toBe(false);
    });

    it("should return true when key exists but value is null", () => {
      const metadata = new Metadata({ name: null });
      expect(metadata.has("name")).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete a key and return true", () => {
      const metadata = new Metadata({ name: "John", age: 30 });
      expect(metadata.delete("name")).toBe(true);
      expect(metadata.has("name")).toBe(false);
      expect(metadata.has("age")).toBe(true);
    });

    it("should return false when key does not exist", () => {
      const metadata = new Metadata({ name: "John" });
      expect(metadata.delete("age")).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all keys", () => {
      const metadata = new Metadata({ name: "John", age: 30 });
      metadata.clear();
      expect(metadata.toObject()).toEqual({});
    });
  });

  describe("toObject", () => {
    it("should return a plain object representation", () => {
      const initialData = { name: "John", age: 30 };
      const metadata = new Metadata(initialData);
      expect(metadata.toObject()).toEqual(initialData);
    });
  });

  describe("keys", () => {
    it("should return an array of all keys", () => {
      const metadata = new Metadata({ name: "John", age: 30 });
      expect(metadata.keys()).toEqual(["name", "age"]);
    });
  });

  describe("values", () => {
    it("should return an array of all values", () => {
      const metadata = new Metadata({ name: "John", age: 30 });
      expect(metadata.values()).toEqual(["John", 30]);
    });
  });

  describe("entries", () => {
    it("should return an array of all [key, value] pairs", () => {
      const metadata = new Metadata({ name: "John", age: 30 });
      expect(metadata.entries()).toEqual([
        ["name", "John"],
        ["age", 30],
      ]);
    });
  });
});
