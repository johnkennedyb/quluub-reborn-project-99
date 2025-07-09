
import React, { useState } from 'react';
import { User } from '@/types/user';

interface ProfileEditSectionsProps {
  user: User;
  onUpdate: (data: Partial<User>) => Promise<void>;
  onClose: () => void;
}

const ProfileEditSections = ({ user, onUpdate, onClose }: ProfileEditSectionsProps) => {
  const [formState, setFormState] = useState({
    interests: user.interests || '',
    traits: user.traits || '',
    ethnicity: Array.isArray(user.ethnicity) ? user.ethnicity.join(', ') : user.ethnicity || '',
    waliDetails: user.waliDetails || '',
    kunya: user.kunya || '',
    dob: user.dateOfBirth ? new Date(user.dateOfBirth) : new Date(),
    maritalStatus: user.maritalStatus || '',
    noOfChildren: user.noOfChildren || '',
    summary: user.summary || '',
    workEducation: user.workEducation || '',
    height: user.height || '',
    weight: user.weight || '',
    hairColor: user.hairColor || '',
    eyeColor: user.eyeColor || '',
    hijabType: user.hijabType || '',
    beardLength: user.beardLength || '',
    region: user.countryOfResidence || '',
    city: user.cityOfResidence || '',
    nationality: user.nationality || '',
    languagesSpoken: user.languagesSpoken || '',
    maritalExpectations: user.maritalExpectations || '',
    aboutFamily: user.aboutFamily || '',
    partnerExpectations: user.partnerExpectations || '',
    contactNumber: user.contactNumber || '',
    waliContactNumber: user.waliContactNumber || '',
    parentEmail: user.parentEmail || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormState(prevState => ({
      ...prevState,
      dob: date || new Date()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      interests: formState.interests,
      traits: formState.traits,
      ethnicity: formState.ethnicity.split(',').map(item => item.trim()).filter(Boolean),
      waliDetails: formState.waliDetails,
      kunya: formState.kunya,
      dob: formState.dob,
      maritalStatus: formState.maritalStatus,
      noOfChildren: formState.noOfChildren,
      summary: formState.summary,
      workEducation: formState.workEducation,
      height: formState.height,
      weight: formState.weight,
      hairColor: formState.hairColor,
      eyeColor: formState.eyeColor,
      hijabType: formState.hijabType,
      beardLength: formState.beardLength,
      countryOfResidence: formState.region,
      cityOfResidence: formState.city,
      nationality: formState.nationality,
      languagesSpoken: formState.languagesSpoken,
      maritalExpectations: formState.maritalExpectations,
      aboutFamily: formState.aboutFamily,
      partnerExpectations: formState.partnerExpectations,
      contactNumber: formState.contactNumber,
      waliContactNumber: formState.waliContactNumber,
      parentEmail: formState.parentEmail,
    };

    try {
      await onUpdate(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-4">
      <div className="mb-4">
        <label htmlFor="interests" className="block text-gray-700 text-sm font-bold mb-2">
          Interests
        </label>
        <input
          type="text"
          id="interests"
          name="interests"
          value={formState.interests}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="traits" className="block text-gray-700 text-sm font-bold mb-2">
          Traits
        </label>
        <input
          type="text"
          id="traits"
          name="traits"
          value={formState.traits}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="ethnicity" className="block text-gray-700 text-sm font-bold mb-2">
          Ethnicity
        </label>
        <input
          type="text"
          id="ethnicity"
          name="ethnicity"
          value={formState.ethnicity}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="waliDetails" className="block text-gray-700 text-sm font-bold mb-2">
          Wali Details
        </label>
        <input
          type="text"
          id="waliDetails"
          name="waliDetails"
          value={formState.waliDetails}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="kunya" className="block text-gray-700 text-sm font-bold mb-2">
          Kunya
        </label>
        <input
          type="text"
          id="kunya"
          name="kunya"
          value={formState.kunya}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      {/* Date of Birth */}
      {/*<div className="mb-4">
        <label htmlFor="dob" className="block text-gray-700 text-sm font-bold mb-2">
          Date of Birth
        </label>
        <DatePicker
          selected={formState.dob}
          onChange={handleDateChange}
          dateFormat="MM/dd/yyyy"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>*/}

      <div className="mb-4">
        <label htmlFor="maritalStatus" className="block text-gray-700 text-sm font-bold mb-2">
          Marital Status
        </label>
        <input
          type="text"
          id="maritalStatus"
          name="maritalStatus"
          value={formState.maritalStatus}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="noOfChildren" className="block text-gray-700 text-sm font-bold mb-2">
          Number of Children
        </label>
        <input
          type="text"
          id="noOfChildren"
          name="noOfChildren"
          value={formState.noOfChildren}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="summary" className="block text-gray-700 text-sm font-bold mb-2">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          value={formState.summary}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="workEducation" className="block text-gray-700 text-sm font-bold mb-2">
          Work/Education
        </label>
        <input
          type="text"
          id="workEducation"
          name="workEducation"
          value={formState.workEducation}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="height" className="block text-gray-700 text-sm font-bold mb-2">
          Height
        </label>
        <input
          type="text"
          id="height"
          name="height"
          value={formState.height}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="weight" className="block text-gray-700 text-sm font-bold mb-2">
          Weight
        </label>
        <input
          type="text"
          id="weight"
          name="weight"
          value={formState.weight}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="hairColor" className="block text-gray-700 text-sm font-bold mb-2">
          Hair Color
        </label>
        <input
          type="text"
          id="hairColor"
          name="hairColor"
          value={formState.hairColor}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="eyeColor" className="block text-gray-700 text-sm font-bold mb-2">
          Eye Color
        </label>
        <input
          type="text"
          id="eyeColor"
          name="eyeColor"
          value={formState.eyeColor}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="hijabType" className="block text-gray-700 text-sm font-bold mb-2">
          Hijab Type
        </label>
        <input
          type="text"
          id="hijabType"
          name="hijabType"
          value={formState.hijabType}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="beardLength" className="block text-gray-700 text-sm font-bold mb-2">
          Beard Length
        </label>
        <input
          type="text"
          id="beardLength"
          name="beardLength"
          value={formState.beardLength}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="region" className="block text-gray-700 text-sm font-bold mb-2">
          Region
        </label>
        <input
          type="text"
          id="region"
          name="region"
          value={formState.region}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-2">
          City
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={formState.city}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="nationality" className="block text-gray-700 text-sm font-bold mb-2">
          Nationality
        </label>
        <input
          type="text"
          id="nationality"
          name="nationality"
          value={formState.nationality}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="languagesSpoken" className="block text-gray-700 text-sm font-bold mb-2">
          Languages Spoken
        </label>
        <input
          type="text"
          id="languagesSpoken"
          name="languagesSpoken"
          value={formState.languagesSpoken}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="maritalExpectations" className="block text-gray-700 text-sm font-bold mb-2">
          Marital Expectations
        </label>
        <input
          type="text"
          id="maritalExpectations"
          name="maritalExpectations"
          value={formState.maritalExpectations}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="aboutFamily" className="block text-gray-700 text-sm font-bold mb-2">
          About Family
        </label>
        <textarea
          id="aboutFamily"
          name="aboutFamily"
          value={formState.aboutFamily}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="partnerExpectations" className="block text-gray-700 text-sm font-bold mb-2">
          Partner Expectations
        </label>
        <textarea
          id="partnerExpectations"
          name="partnerExpectations"
          value={formState.partnerExpectations}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="contactNumber" className="block text-gray-700 text-sm font-bold mb-2">
          Contact Number
        </label>
        <input
          type="text"
          id="contactNumber"
          name="contactNumber"
          value={formState.contactNumber}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="waliContactNumber" className="block text-gray-700 text-sm font-bold mb-2">
          Wali Contact Number
        </label>
        <input
          type="text"
          id="waliContactNumber"
          name="waliContactNumber"
          value={formState.waliContactNumber}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="parentEmail" className="block text-gray-700 text-sm font-bold mb-2">
          Parent Email
        </label>
        <input
          type="email"
          id="parentEmail"
          name="parentEmail"
          value={formState.parentEmail}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="flex justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Update
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProfileEditSections;
