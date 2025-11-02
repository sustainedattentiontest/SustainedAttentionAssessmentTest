import React, { useState } from 'react';
import './Questions.css';
import { QuestionsDAO } from '../../../dao/QuestionsDAO';
import { useSetQuestionsDAO } from '../../../contexts/QuestionsDAOContext';
import { usePageContext } from "../../../contexts/PageContext";
import { useSetParticipantData } from '../../../contexts/ParticipantContext';
import Page from '../../../enums/Page';

interface QuestionsProps {
  onComplete?: () => void;
}

function Questions({ onComplete }: QuestionsProps) {
  const [adhdDiagnosed, setAdhdDiagnosed] = useState<string>('');
  const [attentionalDifficulties, setAttentionalDifficulties] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [errors, setErrors] = useState<{
    adhdDiagnosed?: string;
    attentionalDifficulties?: string;
    age?: string;
    gender?: string;
  }>({});
  const setQuestionsDAO = useSetQuestionsDAO();
  const pageContext = usePageContext();
  const setParticipantData = useSetParticipantData();

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAge(value);
    // Clear error when user starts typing
    if (errors.age) {
      setErrors(prev => ({ ...prev, age: undefined }));
    }
  };

  const handleAgeBlur = () => {
    const ageNum = Number(age);
    if (age !== '' && (ageNum < 18 || ageNum > 60)) {
      setErrors(prev => ({ ...prev, age: 'Age must be between 18 and 60' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {
      adhdDiagnosed?: string;
      attentionalDifficulties?: string;
      age?: string;
      gender?: string;
    } = {};

    if (!adhdDiagnosed) {
      newErrors.adhdDiagnosed = 'Please select an option';
    }

    if (!attentionalDifficulties) {
      newErrors.attentionalDifficulties = 'Please select an option';
    }

    if (!age) {
      newErrors.age = 'Please enter your age';
    } else {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 60) {
        newErrors.age = 'Age must be between 18 and 60';
      }
    }

    if (!gender) {
      newErrors.gender = 'Please select a gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Create QuestionsDAO instance with validated data
      const questionsDAO = new QuestionsDAO(
        adhdDiagnosed,
        attentionalDifficulties,
        age,
        gender
      );

      // Store in QuestionsDAO context
      setQuestionsDAO(questionsDAO);

      // Store in ParticipantContext
      setParticipantData({
        adhdDiagnosed,
        attentionalDifficulties,
        age,
        gender
      });

      // Serialize to JSON
      const jsonData = questionsDAO.toJSON();
      
      // Print the JSON data
      console.log('Questions Data:', jsonData);
      console.log('Questions Data (parsed):', JSON.parse(jsonData));
      
      // Navigate to Instructions page
      pageContext.setPage(Page.Instructions);
    }
  };

  const handleRadioChange = (field: 'adhdDiagnosed' | 'attentionalDifficulties', value: string) => {
    if (field === 'adhdDiagnosed') {
      setAdhdDiagnosed(value);
    } else {
      setAttentionalDifficulties(value);
    }
    // Clear error when user selects an option
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGender(e.target.value);
    // Clear error when user selects an option
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: undefined }));
    }
  };

  return (
    <div className="questions-container">
      <h2 className="questions-heading">
        Please answer the following questions before the test begins
      </h2>
      
      <div className="question-group">
        <label className="question-label">
          Have you previously been diagnosed with ADHD?
        </label>
        <div className="options-container">
          <label className="radio-option">
            <input
              type="radio"
              name="adhd"
              value="yes"
              checked={adhdDiagnosed === 'yes'}
              onChange={(e) => handleRadioChange('adhdDiagnosed', e.target.value)}
              className="radio-input"
            />
            Yes
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="adhd"
              value="no"
              checked={adhdDiagnosed === 'no'}
              onChange={(e) => handleRadioChange('adhdDiagnosed', e.target.value)}
              className="radio-input"
            />
            No
          </label>
        </div>
        {errors.adhdDiagnosed && (
          <span className="error-message">{errors.adhdDiagnosed}</span>
        )}
      </div>

      <div className="question-group">
        <label className="question-label">
          Do you have any diagnosed attentional difficulties?
        </label>
        <div className="options-container">
          <label className="radio-option">
            <input
              type="radio"
              name="attentional"
              value="yes"
              checked={attentionalDifficulties === 'yes'}
              onChange={(e) => handleRadioChange('attentionalDifficulties', e.target.value)}
              className="radio-input"
            />
            Yes
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="attentional"
              value="no"
              checked={attentionalDifficulties === 'no'}
              onChange={(e) => handleRadioChange('attentionalDifficulties', e.target.value)}
              className="radio-input"
            />
            No
          </label>
        </div>
        {errors.attentionalDifficulties && (
          <span className="error-message">{errors.attentionalDifficulties}</span>
        )}
      </div>

      <div className="question-group">
        <label className="question-label">
          Age
        </label>
        <input
          type="number"
          min="18"
          max="60"
          value={age}
          onChange={handleAgeChange}
          onBlur={handleAgeBlur}
          placeholder="Enter age (18-60)"
          className={`input-field ${errors.age ? 'input-error' : ''}`}
        />
        {errors.age && (
          <span className="error-message">{errors.age}</span>
        )}
      </div>

      <div className="question-group">
        <label className="question-label">
          Gender
        </label>
        <select
          value={gender}
          onChange={handleGenderChange}
          className={`select-field ${errors.gender ? 'input-error' : ''} ${gender ? 'select-has-value' : ''}`}
        >
          <option value="" className="select-option">Select gender</option>
          <option value="male" className="select-option">Male</option>
          <option value="female" className="select-option">Female</option>
          <option value="prefer not to specify" className="select-option">Prefer not to specify</option>
        </select>
        {errors.gender && (
          <span className="error-message">{errors.gender}</span>
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="submit-button"
      >
        Continue
      </button>
    </div>
  );
}

export default Questions;

