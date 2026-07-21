const fs = require("fs");

const filePath = "C:/Users/santi/.gemini/antigravity/brain/fa1a2cfb-3cb2-4fb9-9293-dd0412024877/.system_generated/steps/132/content.md";
try {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes("signature") || line.toLowerCase().includes("thought")) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
} catch (err) {
  console.error("Error reading file:", err);
}
