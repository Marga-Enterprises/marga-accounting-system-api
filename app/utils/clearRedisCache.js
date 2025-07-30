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
    const departmentKeys = departmentId ? await redisClient.keys(`department*:${departmentId}`) : [];

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


// clear clients cache
exports.clearClientsCache = async (clientId) => {
  try {
    console.log("🧹 Clearing clients cache...");

    // Define the key patterns for clients
    const pattern = `clients:page*`;
    const filteredPattern = `clients:page*:search*`;
    
    // If a clientId is provided, create a specific key pattern for that client
    const clientKeys = clientId ? await redisClient.keys(`client*:${clientId}`) : [];

    // Fetch all keys matching the patterns
    const allPaginatedKeys = await redisClient.keys(pattern);
    const allFilteredKeys = await redisClient.keys(filteredPattern);

    // Combine all keys into a unique set
    const allKeys = [...new Set([...allPaginatedKeys, ...allFilteredKeys, ...clientKeys])];

    // If there are any keys to delete, proceed with deletion
    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
      console.log(`🗑️ Cleared ${allKeys.length} clients cache entries.`);
    } else {
      console.log("ℹ️ No matching clients cache keys found.");
    }

    console.log("✅ Clients cache cleared.");
  } catch (error) {
    console.error("❌ Error clearing clients cache:", error);
  }
};


// clear client departments cache
exports.clearClientDepartmentsCache = async (departmentId) => {
  try {
    console.log("🧹 Clearing client departments cache...");

    // Define the key patterns for client departments
    const pattern = `client_departments:page*`;
    const filteredPattern = `client_departments:page*:search*:clientId*`;
    
    // If a departmentId is provided, create a specific key pattern for that department
    const departmentKeys = departmentId ? await redisClient.keys(`client_department*:${departmentId}`) : [];

    // Fetch all keys matching the patterns
    const allPaginatedKeys = await redisClient.keys(pattern);
    const allFilteredKeys = await redisClient.keys(filteredPattern);

    // Combine all keys into a unique set
    const allKeys = [...new Set([...allPaginatedKeys, ...allFilteredKeys, ...departmentKeys])];

    // If there are any keys to delete, proceed with deletion
    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
      console.log(`🗑️ Cleared ${allKeys.length} client departments cache entries.`);
    } else {
      console.log("ℹ️ No matching client departments cache keys found.");
    }

    console.log("✅ Client departments cache cleared.");
  } catch (error) {
    console.error("❌ Error clearing client departments cache:", error);
  }
};


// clear client branches cache
exports.clearClientBranchesCache = async (branchId) => {
  try {
    console.log("🧹 Clearing client branches cache...");

    // Define the key patterns for client branches
    const pattern = `client_branches:page*`;
    const filteredPattern = `client_branches:page*:search*:clientId*`;
    
    // If a branchId is provided, create a specific key pattern for that branch
    const branchKeys = branchId ? await redisClient.keys(`client_branch*:${branchId}`) : [];

    // Fetch all keys matching the patterns
    const allPaginatedKeys = await redisClient.keys(pattern);
    const allFilteredKeys = await redisClient.keys(filteredPattern);

    // Combine all keys into a unique set
    const allKeys = [...new Set([...allPaginatedKeys, ...allFilteredKeys, ...branchKeys])];

    // If there are any keys to delete, proceed with deletion
    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
      console.log(`🗑️ Cleared ${allKeys.length} client branches cache entries.`);
    } else {
      console.log("ℹ️ No matching client branches cache keys found.");
    }

    console.log("✅ Client branches cache cleared.");
  } catch (error) {
    console.error("❌ Error clearing client branches cache:", error);
  }
};


// clear billing cache
exports.clearBillingsCache = async (billingId) => {
  try {
    console.log("🧹 Clearing billing cache...");

    // Define the key patterns for billing
    const pattern = `billings:page*`;
    const filteredPattern = `billings:page*:search*:category*:month*year*`;
    
    // If a billingId is provided, create a specific key pattern for that billing
    const billingKeys = billingId ? await redisClient.keys(`billing*:${billingId}`) : [];

    // Fetch all keys matching the patterns
    const allPaginatedKeys = await redisClient.keys(pattern);
    const allFilteredKeys = await redisClient.keys(filteredPattern);

    // Combine all keys into a unique set
    const allKeys = [...new Set([...allPaginatedKeys, ...allFilteredKeys, ...billingKeys])];

    // If there are any keys to delete, proceed with deletion
    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
      console.log(`🗑️ Cleared ${allKeys.length} billing cache entries.`);
    } else {
      console.log("ℹ️ No matching billing cache keys found.");
    }

    console.log("✅ Billing cache cleared.");
  } catch (error) {
    console.error("❌ Error clearing billing cache:", error);
  }
};


// clear machine cache
exports.clearMachinesCache = async (machineId) => {
  try {
    console.log("🧹 Clearing machines cache...");

    // Define the key patterns for machines
    const pattern = `machines:page*`;
    const filteredPattern = `machines:page*:search*`;
    
    // If a machineId is provided, create a specific key pattern for that machine
    const machineKeys = machineId ? await redisClient.keys(`machine*:${machineId}`) : [];

    // Fetch all keys matching the patterns
    const allPaginatedKeys = await redisClient.keys(pattern);
    const allFilteredKeys = await redisClient.keys(filteredPattern);

    // Combine all keys into a unique set
    const allKeys = [...new Set([...allPaginatedKeys, ...allFilteredKeys, ...machineKeys])];

    // If there are any keys to delete, proceed with deletion
    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
      console.log(`🗑️ Cleared ${allKeys.length} machines cache entries.`);
    } else {
      console.log("ℹ️ No matching machines cache keys found.");
    }

    console.log("✅ Machines cache cleared.");
  } catch (error) {
    console.error("❌ Error clearing machines cache:", error);
  }
};


// clear collection cache
exports.clearCollectionsCache = async (collectionId) => {
  try {
    console.log("🧹 Clearing collections cache...");

    // Define the key patterns for collections
    const pattern = `collections:page*`;
    const filteredPattern = `collections:page*:search*`;
    
    // If a collectionId is provided, create a specific key pattern for that collection
    const collectionKeys = collectionId ? await redisClient.keys(`collection*:${collectionId}`) : [];

    // Fetch all keys matching the patterns
    const allPaginatedKeys = await redisClient.keys(pattern);
    const allFilteredKeys = await redisClient.keys(filteredPattern);

    // Combine all keys into a unique set
    const allKeys = [...new Set([...allPaginatedKeys, ...allFilteredKeys, ...collectionKeys])];

    // If there are any keys to delete, proceed with deletion
    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
      console.log(`🗑️ Cleared ${allKeys.length} collections cache entries.`);
    } else {
      console.log("ℹ️ No matching collections cache keys found.");
    }

    console.log("✅ Collections cache cleared.");
  } catch (error) {
    console.error("❌ Error clearing collections cache:", error);
  }
};


// clear payment cache
exports.clearPaymentsCache = async (paymentId) => {
  try {
    console.log("🧹 Clearing payments cache...");

    // Define the key patterns for payments
    const pattern = `payments:page*`;
    const filteredPattern = `payments:page*:search*:type*`;
    
    // If a paymentId is provided, create a specific key pattern for that payment
    const paymentKeys = paymentId ? await redisClient.keys(`payment*:${paymentId}`) : [];

    // Fetch all keys matching the patterns
    const allPaginatedKeys = await redisClient.keys(pattern);
    const allFilteredKeys = await redisClient.keys(filteredPattern);

    // Combine all keys into a unique set
    const allKeys = [...new Set([...allPaginatedKeys, ...allFilteredKeys, ...paymentKeys])];

    // If there are any keys to delete, proceed with deletion
    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
      console.log(`🗑️ Cleared ${allKeys.length} payments cache entries.`);
    } else {
      console.log("ℹ️ No matching payments cache keys found.");
    }

    console.log("✅ Payments cache cleared.");
  } catch (error) {
    console.error("❌ Error clearing payments cache:", error);
  }
};