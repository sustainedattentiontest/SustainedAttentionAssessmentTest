/**
 * Base DAO class that provides JSON serialization/deserialization
 * for all class properties using reflection-like behavior
 */
export class DAO {
  /**
   * Serializes the object to JSON
   * @returns JSON string representation of the object
   */
  toJSON(): string {
    const obj: Record<string, any> = {};
    
    // Get all properties from the instance
    for (const key in this) {
      if (this.hasOwnProperty(key)) {
        obj[key] = this[key];
      }
    }
    
    return JSON.stringify(obj);
  }

  /**
   * Deserializes JSON and populates the object properties
   * This method should be overridden in subclasses
   * @param json JSON string or object to deserialize
   * @returns The instance with populated properties
   */
  static fromJSON(json: string | object): DAO {
    const instance = new this();
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    
    // Copy all properties from JSON data to instance
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        (instance as any)[key] = data[key];
      }
    }
    
    return instance;
  }
}

