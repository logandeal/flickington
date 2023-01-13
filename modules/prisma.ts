import { PrismaClient } from "@prisma/client";

function UNSAFE_DEV_ONLY_replaceParamsInSQL(sql: string, params: any[]) {
  let i = 0;
  return sql.replace(/\?/g, () => {
    const param = params[i++];
    if (Array.isArray(param)) {
      return `"${JSON.stringify(param)}"`;
    }
    return JSON.stringify(param);
  });
}

function createPrismaClient() {
  if (process.env.LOG_UNSAFE_QUERIES === "true") {
    const prisma = new PrismaClient({
      log: [
        {
          emit: "event",
          level: "query",
        },
      ],
    });

    prisma.$on("query", (e) => {
      console.log(e.params);
      console.log(
        UNSAFE_DEV_ONLY_replaceParamsInSQL(e.query, JSON.parse(e.params))
      );
    });

    return prisma;
  } else {
    return new PrismaClient();
  }
}

const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;
