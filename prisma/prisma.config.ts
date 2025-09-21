// There is no "@prisma/config" package. Use the standard export for Prisma seed config.
export default {
  seed: {
    run: async () => {
      // call your seed script
      await import("./seed");
    },
  },
};
