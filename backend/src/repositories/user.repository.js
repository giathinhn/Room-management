const prisma = require('../config/database');

/**
 * User repository — handles all Prisma calls related to users.
 */
const userRepository = {
  /**
   * Find a user by email (includes passwordHash for auth).
   * @param {string} email
   */
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  /**
   * Find a user by ID.
   * @param {string} id
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Create a new user.
   * @param {{ email: string, passwordHash: string, fullName: string }} data
   */
  async create(data) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  /**
   * Get all users with optional filtering and pagination.
   * @param {{ page?: number, limit?: number, role?: string, search?: string, isActive?: boolean }} filters
   */
  async findAll({ page = 1, limit = 20, role, search, isActive } = {}) {
    const where = {};

    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update a user's role.
   * @param {string} id
   * @param {string} role  — 'admin' | 'approver' | 'user'
   */
  async updateRole(id, role) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Update arbitrary user fields.
   * @param {string} id
   * @param {object} data — e.g. { fullName, isActive, passwordHash }
   */
  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Find all active users with a specific role.
   * Used by notification service to notify approvers / admins.
   * @param {'admin'|'approver'|'user'} role
   */
  async findByRole(role) {
    return prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true, email: true, fullName: true, role: true },
    });
  },
};

module.exports = userRepository;
