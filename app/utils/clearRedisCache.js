// redis client
const redisClient = require('@config/redis');


// clear department cache
exports.clearDepartmentCache = async (departmentId) => {
  try {
    console.log("🧹 Clearing department cache...");

    // Define the key patterns for departments
    const pattern = `deparments:page*`;
    const filteredPattern = `departments:page*:search*`;
    
    // If a departmentId is provided, create a specific key pattern for that department
    const departmentKeys = departmentId ? await redisClient.keys(`department*_${departmentId}`) : [];

    // Fetch all keys matching the patterns
    const allPaginatedKeys = await redisClient.keys(pattern);
    const allFilteredKeys = await redisClient.keys(filteredPattern);

    // Combine all keys into a unique set
    const allKeys = [...new Set([...allPaginatedKeys, ...allFilteredKeys, ...departmentKeys])];

    // If there are any keys to delete, proceed with deletion
    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
      console.log(`🗑️ Cleared ${allKeys.length} department cache entries.`);
    } else {
      console.log("ℹ️ No matching department cache keys found.");
    }

    console.log("✅ Department cache cleared.");
  } catch (error) {
    console.error("❌ Error clearing department cache:", error);
  }
};