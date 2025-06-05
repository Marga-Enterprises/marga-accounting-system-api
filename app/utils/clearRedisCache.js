exports.clearUserCache = async (userId) => {
  try {
    console.log("🧹 Clearing user cache...");

    // Define the pattern for user cache keys
    const pattern = `user:${userId}:*`;

    // Get all keys matching the pattern
    const allKeys = await redisClient.keys(pattern);

    // If there are matching keys, delete them
    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
      console.log(`🗑️ Cleared ${allKeys.length} user cache entries.`);
    } else {
      console.log("ℹ️ No matching user cache keys found.");
    }

    console.log("✅ User cache cleared.");
  } catch (error) {
    console.error("❌ Error clearing user cache:", error);
  }
}