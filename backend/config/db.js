
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Utility function to safely convert string or timestamp to ObjectId
const toObjectId = (id) => {
  try {
    if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) {
      return new mongoose.Types.ObjectId(id); // valid ObjectId string
    } else if (typeof id === "number") {
      return mongoose.Types.ObjectId.createFromTime(id); // use timestamp
    } else {
      throw new Error("Invalid ObjectId input");
    }
  } catch (error) {
    console.error("Invalid ObjectId:", error);
    return id;
  }
};

module.exports = {
  connectDB,
  mongoose,
  toObjectId
};
