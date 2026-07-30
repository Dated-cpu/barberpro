import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.fn();

vi.mock('@/server/db/client', () => ({
  default: {
    user: {
      findMany: mockFindMany,
    },
  },
}));

const { customerService } = await import('@/server/services/customers');

const baseUser = {
  id: '00000000-0000-0000-0000-000000000001',
  firstName: 'Иван',
  lastName: 'Петров',
  phone: '+79991234567',
  email: 'ivan@test.com',
  role: 'CLIENT' as const,
  isActive: true,
  deletedAt: null,
  createdAt: new Date('2026-07-01'),
  _count: { clientAppointments: 0 },
};

beforeEach(() => {
  mockFindMany.mockReset();
});

describe('customerService.list', () => {
  it('должен вернуть активного CLIENT пользователя', async () => {
    mockFindMany.mockResolvedValue([baseUser]);

    const result = await customerService.list('barber-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe(baseUser.id);
    expect(result.items[0]!.firstName).toBe('Иван');
  });

  it('должен фильтровать только по CLIENT + isActive + не удалённых', async () => {
    mockFindMany.mockResolvedValue([]);

    await customerService.list('barber-1');

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callWhere = mockFindMany.mock.calls[0]![0]!.where;
    expect(callWhere.role).toBe('CLIENT');
    expect(callWhere.isActive).toBe(true);
    expect(callWhere.deletedAt).toBeNull();
  });

  it('должен вернуть пустой список если CLIENT не найден', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await customerService.list('barber-1');

    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it('должен вернуть hasMore=true если результатов больше лимита', async () => {
    const users = Array.from({ length: 21 }, (_, i) => ({
      ...baseUser,
      id: `00000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}`,
    }));
    mockFindMany.mockResolvedValue(users);

    const result = await customerService.list('barber-1', undefined, 20);

    expect(result.items).toHaveLength(20);
    expect(result.nextCursor).not.toBeNull();
  });

  it('должен поддерживать поиск по имени', async () => {
    mockFindMany.mockResolvedValue([baseUser]);

    const result = await customerService.list('barber-1', 'Иван');

    expect(result.items).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ firstName: { contains: 'Иван', mode: 'insensitive' } }),
          ]),
        }),
      }),
    );
  });
});
