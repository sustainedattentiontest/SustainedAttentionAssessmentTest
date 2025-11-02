import { DAO } from './DAO';

/**
 * Data Access Object for Questions form data
 */
export class QuestionsDAO extends DAO {
  adhdDiagnosed: string = '';
  attentionalDifficulties: string = '';
  age: string = '';
  gender: string = '';

  constructor(
    adhdDiagnosed: string = '',
    attentionalDifficulties: string = '',
    age: string = '',
    gender: string = ''
  ) {
    super();
    this.adhdDiagnosed = adhdDiagnosed;
    this.attentionalDifficulties = attentionalDifficulties;
    this.age = age;
    this.gender = gender;
  }

  /**
   * Creates a QuestionsDAO instance from JSON
   * @param json JSON string or object to deserialize
   * @returns QuestionsDAO instance
   */
  static fromJSON(json: string | object): QuestionsDAO {
    const instance = new QuestionsDAO();
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

