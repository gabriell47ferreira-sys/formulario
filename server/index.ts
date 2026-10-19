import { app } from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[API JURÍDICO] Servidor backend ativo na porta ${PORT}`);
  console.log(`[API JURÍDICO] Rota pública: POST http://localhost:${PORT}/api/submissions`);
  console.log(`[API JURÍDICO] Área restrita admin: http://localhost:${PORT}/api/admin/*`);
});
