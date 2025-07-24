import passwordValidator from "password-validator";

export const capitalizeFirstLetter = (string) => {
  return string?.length > 0
    ? string.charAt(0).toUpperCase() + string.slice(1)
    : string;
};

export const camelCaseToWords = (str) => {
  const result = str.replace(/([A-Z])/g, " $1");
  return result?.length > 0
    ? result.charAt(0).toUpperCase() + result.slice(1)
    : result;
};

export const allFieldsRemoveAny = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== "Any" && obj[key] !== "") {
      acc[key] = obj[key];
    }

    return acc;
  }, {});
};

export const removeNullUndefinedFields = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (Array.isArray(obj[key])) {
      if (obj[key].length > 0) {
        acc[key] = obj[key];
      }
    } else if (obj[key] !== null && obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

export const noWali = (currentUser) => {
  if (currentUser.gender === "female") {
    if (!currentUser.waliDetails) {
      return true;
    }

    if (typeof currentUser.waliDetails === "object") {
      if (!currentUser.waliDetails.email) {
        return true;
      } else {
        return false;
      }
    }

    if (!JSON.parse(currentUser.waliDetails).email) {
      return true;
    }

    return false;
  } else {
    return false;
  }
};

export const noDob = (currentUser) => {
  if (
    currentUser.dob === "0000-00-00" ||
    currentUser.dob === "0000-00-00 00:00:00" ||
    !currentUser.dob
  ) {
    return true;
  }
  return false;
};

export const noCompulsoryInfo = (currentUser) => {
  if (
    !currentUser.summary ||
    !currentUser.nationality ||
    !currentUser.country
  ) {
    return true;
  }
  return false;
};

export const isEmail = (email) => {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
};

export function validatePassword(password) {
  let schema = new passwordValidator();

  schema
    .is()
    .min(8) // Minimum length 8
    .is()
    .max(100) // Maximum length 100
    .has()
    .uppercase() // Must have uppercase letters
    .has()
    .lowercase() // Must have lowercase letters
    .has()
    .digits(1) // Must have at least 1 digits
    .has()
    .not()
    .spaces() // Should not have spaces
    .is()
    .not()
    .oneOf(["Passw0rd", "Password123", "Password"]);

  return schema.validate(password);
}
