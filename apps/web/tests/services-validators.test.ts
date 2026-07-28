import { describe, it, expect } from 'vitest';
import { dashboardQuerySchema, calendarQuerySchema, analyticsQuerySchema } from '../src/validators/dashboard';
import { createServiceSchema, updateServiceSchema, serviceIdSchema, serviceListSchema } from '../src/validators/services';
import { createPortfolioSchema, updatePortfolioSchema, portfolioIdSchema } from '../src/validators/portfolio';
import { moderateReviewSchema, reviewListSchema } from '../src/validators/reviews';
import { customerListSchema, customerIdSchema } from '../src/validators/customers';
import { updateWorkingDaySchema, createBlockedSlotSchema, deleteBlockedSlotSchema, updateProfileSchema, systemSettingSchema } from '../src/validators/settings';

describe('Dashboard validators', () => {
  it('should accept dashboardQuerySchema with date', () => {
    expect(dashboardQuerySchema.safeParse({ date: '2026-07-26' }).success).toBe(true);
  });
  it('should accept dashboardQuerySchema without date', () => {
    expect(dashboardQuerySchema.safeParse({}).success).toBe(true);
  });
  it('should reject dashboardQuerySchema with bad date format', () => {
    expect(dashboardQuerySchema.safeParse({ date: '26-07-2026' }).success).toBe(false);
  });
  it('should accept calendarQuerySchema', () => {
    expect(calendarQuerySchema.safeParse({ startDate: '2026-07-01', endDate: '2026-07-31' }).success).toBe(true);
  });
  it('should reject calendarQuerySchema with missing endDate', () => {
    expect(calendarQuerySchema.safeParse({ startDate: '2026-07-01' }).success).toBe(false);
  });
  it('should accept analyticsQuerySchema', () => {
    expect(analyticsQuerySchema.safeParse({ from: '2026-01-01', to: '2026-12-31' }).success).toBe(true);
  });
});

describe('Services validators', () => {
  it('should accept createServiceSchema', () => {
    expect(createServiceSchema.safeParse({ name: 'Test', price: 1500, duration: 60 }).success).toBe(true);
  });
  it('should accept createServiceSchema with all fields', () => {
    expect(createServiceSchema.safeParse({ name: 'Test', description: 'Desc', price: 1500, duration: 60, category: 'haircut', branchId: '00000000-0000-0000-0000-000000000001' }).success).toBe(true);
  });
  it('should reject createServiceSchema with negative price', () => {
    expect(createServiceSchema.safeParse({ name: 'Test', price: -100, duration: 60 }).success).toBe(false);
  });
  it('should accept updateServiceSchema', () => {
    expect(updateServiceSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001', name: 'Updated', price: 2000 }).success).toBe(true);
  });
  it('should reject updateServiceSchema without id', () => {
    expect(updateServiceSchema.safeParse({ name: 'Test' }).success).toBe(false);
  });
  it('should accept serviceIdSchema', () => {
    expect(serviceIdSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001' }).success).toBe(true);
  });
  it('should accept serviceListSchema defaults', () => {
    expect(serviceListSchema.safeParse({}).success).toBe(true);
  });
});

describe('Portfolio validators', () => {
  const uuid = '00000000-0000-0000-0000-000000000001';
  it('should accept createPortfolioSchema', () => {
    expect(createPortfolioSchema.safeParse({ title: 'My Work', imageIds: [uuid] }).success).toBe(true);
  });
  it('should reject createPortfolioSchema with empty title', () => {
    expect(createPortfolioSchema.safeParse({ title: '', imageIds: [uuid] }).success).toBe(false);
  });
  it('should reject createPortfolioSchema without imageIds', () => {
    expect(createPortfolioSchema.safeParse({ title: 'My Work' }).success).toBe(false);
  });
  it('should accept updatePortfolioSchema', () => {
    expect(updatePortfolioSchema.safeParse({ id: uuid, title: 'Updated' }).success).toBe(true);
  });
  it('should accept portfolioIdSchema', () => {
    expect(portfolioIdSchema.safeParse({ id: uuid }).success).toBe(true);
  });
});

describe('Reviews validators', () => {
  const uuid = '00000000-0000-0000-0000-000000000001';
  it('should accept moderateReviewSchema', () => {
    expect(moderateReviewSchema.safeParse({ reviewId: uuid, status: 'APPROVED' }).success).toBe(true);
  });
  it('should reject moderateReviewSchema with invalid status', () => {
    expect(moderateReviewSchema.safeParse({ reviewId: uuid, status: 'INVALID' }).success).toBe(false);
  });
  it('should accept reviewListSchema defaults', () => {
    const result = reviewListSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('ALL');
  });
  it('should accept reviewListSchema with status', () => {
    expect(reviewListSchema.safeParse({ status: 'PENDING' }).success).toBe(true);
  });
});

describe('Customers validators', () => {
  const uuid = '00000000-0000-0000-0000-000000000001';
  it('should accept customerListSchema defaults', () => {
    expect(customerListSchema.safeParse({}).success).toBe(true);
  });
  it('should accept customerListSchema with search', () => {
    expect(customerListSchema.safeParse({ search: 'Alex' }).success).toBe(true);
  });
  it('should accept customerIdSchema', () => {
    expect(customerIdSchema.safeParse({ id: uuid }).success).toBe(true);
  });
  it('should reject customerIdSchema with invalid uuid', () => {
    expect(customerIdSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('Settings validators', () => {
  it('should accept updateWorkingDaySchema', () => {
    expect(updateWorkingDaySchema.safeParse({ dayOfWeek: 1, startTime: '09:00', endTime: '19:00', isDayOff: false }).success).toBe(true);
  });
  it('should reject updateWorkingDaySchema with invalid dayOfWeek', () => {
    expect(updateWorkingDaySchema.safeParse({ dayOfWeek: 8, startTime: '09:00', endTime: '19:00' }).success).toBe(false);
  });
  it('should accept updateWorkingDaySchema with isDayOff', () => {
    expect(updateWorkingDaySchema.safeParse({ dayOfWeek: 7, startTime: '00:00', endTime: '00:00', isDayOff: true }).success).toBe(true);
  });
  it('should accept createBlockedSlotSchema', () => {
    expect(createBlockedSlotSchema.safeParse({ startTime: '2026-07-26T10:00:00Z', endTime: '2026-07-26T12:00:00Z' }).success).toBe(true);
  });
  it('should reject createBlockedSlotSchema with bad date', () => {
    expect(createBlockedSlotSchema.safeParse({ startTime: 'not-a-date', endTime: '2026-07-26T12:00:00Z' }).success).toBe(false);
  });
  it('should accept deleteBlockedSlotSchema', () => {
    expect(deleteBlockedSlotSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001' }).success).toBe(true);
  });
  it('should accept updateProfileSchema', () => {
    expect(updateProfileSchema.safeParse({ firstName: 'John', lastName: 'Doe' }).success).toBe(true);
  });
  it('should reject updateProfileSchema with short name', () => {
    expect(updateProfileSchema.safeParse({ firstName: 'J' }).success).toBe(false);
  });
  it('should accept systemSettingSchema', () => {
    expect(systemSettingSchema.safeParse({ key: 'business_hours', value: { open: '09:00', close: '21:00' } }).success).toBe(true);
  });
  it('should reject systemSettingSchema without key', () => {
    expect(systemSettingSchema.safeParse({ value: 'test' }).success).toBe(false);
  });
});
