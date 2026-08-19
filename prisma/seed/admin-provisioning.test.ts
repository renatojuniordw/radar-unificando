import { describe, it, expect, vi } from "vitest";
import { provisionAdmin } from "./admin-provisioning";

function mockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      ...(overrides.user || {}),
    },
  } as any;
}

const INPUT = {
  email: "Admin@Radar.com",
  passwordHash: "hash-bcrypt",
  name: "Admin",
};

describe("provisionAdmin", () => {
  it("should_create_admin_when_email_does_not_exist", async () => {
    const prisma = mockPrisma();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "1", email: "admin@radar.com" });

    const result = await provisionAdmin(prisma, INPUT);

    expect(result).toEqual({ created: true, email: "admin@radar.com" });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "admin@radar.com",
        passwordHash: "hash-bcrypt",
        name: "Admin",
        role: "admin",
      },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("should_ensure_role_without_overwriting_password_when_admin_exists", async () => {
    const prisma = mockPrisma();
    prisma.user.findFirst.mockResolvedValue({
      id: "42",
      email: "admin@radar.com",
    });
    prisma.user.update.mockResolvedValue({
      id: "42",
      email: "admin@radar.com",
    });

    const result = await provisionAdmin(prisma, INPUT);

    expect(result).toEqual({ created: false, email: "admin@radar.com" });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "42" },
      data: { role: "admin" },
    });
    // Nunca toca na senha de um admin existente.
    expect(
      prisma.user.update.mock.calls[0][0].data.passwordHash,
    ).toBeUndefined();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should_lowercase_email_before_lookup", async () => {
    const prisma = mockPrisma();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "1", email: "admin@radar.com" });

    await provisionAdmin(prisma, {
      email: "ADMIN@Radar.COM",
      passwordHash: "h",
      name: "Admin",
    });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: "admin@radar.com" },
    });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "admin@radar.com" }),
      }),
    );
  });

  it("should_use_default_name_when_not_provided", async () => {
    const prisma = mockPrisma();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "1", email: "admin@radar.com" });

    await provisionAdmin(prisma, {
      email: "admin@radar.com",
      passwordHash: "h",
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Admin" }),
      }),
    );
  });
});
