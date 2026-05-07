import { BrowserRouter, Routes, Route } from 'react-router-dom'

// TODO: substituir cada placeholder pelo import da página real quando ela for criada
// Exemplo: import Dashboard from './pages/Dashboard/Dashboard'

function Dashboard() {
  return <div>Placeholder — substituir por: import Dashboard from './pages/Dashboard/Dashboard'</div>
}

function Clientes() {
  return <div>Placeholder — substituir por: import Clientes from './pages/Clientes/Clientes'</div>
}

function ClientePerfil() {
  return <div>Placeholder — substituir por: import ClientePerfil from './pages/ClientePerfil/ClientePerfil'</div>
}

function Pedidos() {
  return <div>Placeholder — substituir por: import Pedidos from './pages/Pedidos/Pedidos'</div>
}

function Produtos() {
  return <div>Placeholder — substituir por: import Produtos from './pages/Produtos/Produtos'</div>
}

function Tickets() {
  return <div>Placeholder — substituir por: import Tickets from './pages/Tickets/Tickets'</div>
}

function Chat() {
  return <div>Placeholder — substituir por: import Chat from './pages/Chat/Chat'</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz → Dashboard analítico */}
        <Route path="/" element={<Dashboard />} />

        {/* Listagem de clientes com busca e filtros */}
        <Route path="/clientes" element={<Clientes />} />

        {/* Perfil 360 de um cliente específico */}
        <Route path="/clientes/:id" element={<ClientePerfil />} />

        {/* Listagem de pedidos com filtros */}
        <Route path="/pedidos" element={<Pedidos />} />

        {/* Catálogo de produtos + CRUD */}
        <Route path="/produtos" element={<Produtos />} />

        {/* Listagem de tickets de suporte */}
        <Route path="/tickets" element={<Tickets />} />

        {/* Chat com o agente de IA */}
        <Route path="/chat" element={<Chat />} />

        {/* TODO (DIF): adicionar rota /login quando a feature de autenticação (US-22) for implementada */}
      </Routes>
    </BrowserRouter>
  )
}
