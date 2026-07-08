import("./server/src/index.js").catch((error) => {
  console.error("Falha ao iniciar a aplicacao:", error);
  process.exit(1);
});
