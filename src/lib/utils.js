const fs = require("fs");

async function exists(filepath) {
  try {
    await fs.promises.stat(filepath);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  exists,
};
