import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard/Dashboard'
import Clientes from './pages/Clientes/Clientes'
import ClientePerfil from './pages/Clientes/ClientePerfil'
import Pedidos from './pages/Pedidos/Pedidos'
import Produtos from './pages/Produtos/Produtos'
import Tickets from './pages/Tickets/Tickets'
import Chat from './pages/Chat/Chat'
import { AssistenteProvider } from './components/organisms/chat/AssistenteProvider'
import { Assistente } from './components/organisms/chat/Assistente'

export default function App() {
  return (
    <BrowserRouter>
      <AssistenteProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClientePerfil />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
        <Assistente />
      </AssistenteProvider>
    </BrowserRouter>
  )
}
