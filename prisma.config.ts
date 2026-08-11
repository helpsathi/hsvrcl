import "dotenv/config";

export default {
  schema: "packages/shared/prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/helpsathi",
  },
};
