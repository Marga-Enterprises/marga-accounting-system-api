// models and sequelize imports
const { Machine } = require('@models');
const { Op } = require('sequelize');

// validator functions
const {
    validateMachineFields,
    validateMachineId,
    validateListMachinesParams
} = require('@validators/machine');

// utility redis client
const { clearMachinesCache } = require('@utils/clearRedisCache');

// redis
const redisClient = require('@config/redis');


// service to create a new machine
exports.createMachineService = async (data) => {
    const {
        machine_brand,
        machine_model,
        machine_description,
        machine_serial_number,
    } = data;

    // validate input
    validateMachineFields(data);

    // check for existing machine by serial number
    const existingMachine = await Machine.findOne({ where: { machine_serial_number } });

    if (existingMachine) {
        // if the machine exists, throw an error
        const error = new Error('Machine with this serial number already exists.');
        error.statusCode = 409; // Conflict
        throw error;
    } else {
        // create a new machine
        const newMachine = await Machine.create({
            machine_brand,
            machine_model,
            machine_description,
            machine_serial_number,
        });

        // clear cache for machines
        await clearMachinesCache();

        return newMachine;
    }
};


// service to get all machines
exports.getAllMachinesService = async (params) => {
    // validate input parameters
    validateListMachinesParams(params);

    let { pageIndex, pageSize, search } = params;

    pageIndex = parseInt(pageIndex, 10) || 0;
    pageSize = parseInt(pageSize, 10) || 10;
    const offset = pageIndex * pageSize;
    const limit = pageSize;

    // create cache key
    const cacheKey = `machines:page:${pageIndex}:size:${pageSize}:search:${search || ''}`;
    const cachedMachines = await redisClient.get(cacheKey);
    if (cachedMachines) {
        // if cache exists, return cached data
        return JSON.parse(cachedMachines);
    }

    // build the where clause if search is provided
    const whereClause = search ? {
        [Op.or]: [
            { machine_brand: { [Op.like]: `%${search}%` } },
            { machine_model: { [Op.like]: `%${search}%` } },
            { machine_serial_number: { [Op.like]: `%${search}%` } },
        ]
    } : {};

    // fetch machines from the database
    const { count, rows } = await Machine.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / pageSize);

    // prepare the response object
    const response = {
        pageIndex,
        pageSize,
        totalPages,
        totalRecords: count,
        machines: rows,
    };

    // cache the response
    await redisClient.set(cacheKey, JSON.stringify(response), 'EX', 3600); // cache for 1 hour

    return response;
};


// service to get a machine by ID
exports.getMachineByIdService = async (machineId) => {
    // validate machine ID
    validateMachineId(machineId);

    // create cache key
    const cacheKey = `machine:${machineId}`;
    const cachedMachine = await redisClient.get(cacheKey);
    if (cachedMachine) {
        // if cache exists, return cached data
        return JSON.parse(cachedMachine);
    }

    // fetch machine from the database
    const machine = await Machine.findByPk(machineId);
    if (!machine) {
        const error = new Error('Machine not found.');
        error.statusCode = 404; // Not Found
        throw error;
    }

    // cache the machine data
    await redisClient.set(cacheKey, JSON.stringify(machine), 'EX', 3600); // cache for 1 hour

    return machine;
};


// service to update a machine by ID
exports.updateMachineByIdService = async (machineId, data) => {
    // validate machine ID
    validateMachineId(machineId);

    // fetch the existing machine
    const machine = await Machine.findByPk(machineId);
    if (!machine) {
        const error = new Error('Machine not found.');
        error.statusCode = 404; // Not Found
        throw error;
    }

    // update the machine with new data
    await machine.update(data);

    // clear cache for machines
    await clearMachinesCache(machineId);

    return machine;
};


// service to delete a machine by ID
exports.deleteMachineByIdService = async (machineId) => {
    // validate machine ID
    validateMachineId(machineId);

    // fetch the existing machine
    const machine = await Machine.findByPk(machineId);
    if (!machine) {
        const error = new Error('Machine not found.');
        error.statusCode = 404; // Not Found
        throw error;
    }

    // delete the machine
    await machine.destroy();

    // clear cache for machines
    await clearMachinesCache();

    return { message: 'Machine deleted successfully.' };
};