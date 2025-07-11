// models and sequelize imports
const { Department } = require('@models');
const { Op } = require('sequelize');

// validator functions
const {
    validateDepartmentFields,
    validateListDepartmentsParams,
    validateDepartmentId,
} = require('@validators/department');

// utility redis client
const { clearDepartmentCache } = require('@utils/clearRedisCache');

// redis
const redisClient = require('@config/redis');

// Create a new department service
exports.createDepartmentService = async (data) => {
    const { department_name, department_description } = data;

    // validate the input data
    validateCreateDepartmentFields(data);

    // create a new department instance
    const newDepartment = await Department.create({
        department_name,
        department_description
    });

    // clear the department cache
    await clearDepartmentCache();

    // return the saved department data
    return newDepartment;
};


// Get all departments service
exports.getAllDepartmentsService = async (query) => {
    // validate the query parameters
    validateListDepartmentsParams(query);

    // get the query parameters
    let { pageIndex, pageSize, search } = query;

    // set default values for pagination
    pageIndex = parseInt(pageIndex)
    pageSize = parseInt(pageSize);

    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;

    // check if the departments are cached in Redis
    const cacheKey = `departments:page:${pageIndex}:${pageSize}:search:${search || ''}`;
    const cachedDepartments = await redisClient.get(cacheKey);

    if (cachedDepartments) {
        // return cached departments if available
        return JSON.parse(cachedDepartments);
    }
    
    // where for filtering departments
    const where = search ? {
        department_name: {
            [Op.like]: `%${search}%`
        }
    }: {};

    // retrieve departments from the database with pagination and filtering
    const { count, rows } = await Department.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        offset,
        limit,
        raw: true
    });

    const totalPages = Math.ceil(count / pageSize);

    // prepare the response data
    const response = {
        pageIndex,
        pageSize,
        totalPages,
        totalRecords: count,
        departments: rows
    };

    // cache the response data in Redis
    await redisClient.set(cacheKey, JSON.stringify(response), 'EX', 3600);

    return response;
};


// Get a department by ID service
exports.getDepartmentByIdService = async (id) => {
    // validate the ID
    validateDepartmentId(id);

    // check if the department is cached in Redis
    const cacheKey = `department:${id}`;
    const cachedDepartment = await redisClient.get(cacheKey);

    if (cachedDepartment) {
        // return cached department if available
        return JSON.parse(cachedDepartment);
    }

    // retrieve the department from the database
    const department = await Department.findByPk(id, { raw: true });

    if (!department) {
        throw new Error('Department not found.');
    }

    return department;
};


// Update a department service
exports.updateDepartmentService = async (id, data) => {
    // validate the ID
    validateDepartmentId(id);

    // validate the input data
    validateDepartmentFields(data);

    // check if the department exists
    const department = await Department.findByPk(id);
    if (!department) {
        throw new Error('Department not found.');
    }

    // update the department with new data
    await department.update(data);

    // clear the department cache
    await clearDepartmentCache(id);

    return department;
};


// Delete a department service
exports.deleteDepartmentService = async (id) => {
    // validate the ID
    validateDepartmentId(id);

    // check if the department exists
    const department = await Department.findByPk(id);
    if (!department) {
        throw new Error('Department not found.');
    }

    // delete the department
    await department.destroy();

    // clear the department cache
    await clearDepartmentCache(id);

    return { message: 'Department deleted successfully.' };
};