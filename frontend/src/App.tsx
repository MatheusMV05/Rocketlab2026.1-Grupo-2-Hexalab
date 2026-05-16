import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './contexts/AuthContext'
import { AssistenteProvider } from './components/organisms/chat/AssistenteProvider'
import { Assistente } from './components/organisms/chat/Assistente'
import { RotaProtegida } from './components/atoms/compartilhados/RotaProtegida'
import Login from './pages/Login/Login'
import DefinirSenha from './pages/Login/DefinirSenha'
import Dashboard from './pages/Dashboard/Dashboard'
import Clientes from './pages/Clientes/Clientes'
import ClientePerfil from './pages/Clientes/ClientePerfil'
import Pedidos from './pages/Pedidos/Pedidos'
import Produtos from './pages/Produtos/Produtos'
import Tickets from './pages/Tickets/Tickets'
import Chat from './pages/Chat/Chat'
import PerfilUsuario from './pages/Perfil/PerfilUsuario'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <AssistenteProvider>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/definir-senha" element={<DefinirSenha />} />

              {/* Rotas protegidas */}
              <Route path="/" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
              <Route path="/clientes" element={<RotaProtegida><Clientes /></RotaProtegida>} />
              <Route path="/clientes/:id" element={<RotaProtegida><ClientePerfil /></RotaProtegida>} />
              <Route path="/pedidos" element={<RotaProtegida><Pedidos /></RotaProtegida>} />
              <Route path="/produtos" element={<RotaProtegida><Produtos /></RotaProtegida>} />
              <Route path="/tickets" element={<RotaProtegida><Tickets /></RotaProtegida>} />
              <Route path="/chat" element={<RotaProtegida><Chat /></RotaProtegida>} />
              <Route path="/perfil" element={<RotaProtegida><PerfilUsuario /></RotaProtegida>} />
            </Routes>
            <Assistente />
          </AssistenteProvider>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
