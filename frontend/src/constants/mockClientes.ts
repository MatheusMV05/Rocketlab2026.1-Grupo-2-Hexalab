export const CLIENTES_MOCK_ALL = [
  { id: '#f3221', nome: 'Maria Day', telefone: '55 (14) 9977-1729', email: 'marla.day697@hotmail.com', uf: 'Jaguaribara - CE', cadastro: '12/05/2016', source: 'REFERRAL', clienteDesde: '2016', ultimaCompra: '02 dias' },
  { id: '#2f02d', nome: 'Kevin Cantu', telefone: '55 (81) 1347-4824', email: 'kevin.cantu@gmail.com', uf: 'Rio de Janeiro - RJ', cadastro: '03/02/2024', source: 'REFERRAL', clienteDesde: '2024', ultimaCompra: '15 dias' },
  { id: '#30746', nome: 'Ronald Daniel', telefone: '55 (85) 8822-6332', email: 'ronald.dan@outlook.com', uf: 'Rio Branco - AC', cadastro: '12/04/2016', source: 'WEB', clienteDesde: '2016', ultimaCompra: '10 dias' },
  { id: '#15a69', nome: 'Katherine Smith', telefone: '55 (98) 4894-1347', email: 'kate.smith@yahoo.com', uf: 'Cuiabá - MT', cadastro: '21/06/2019', source: 'WEB', clienteDesde: '2019', ultimaCompra: '05 dias' },
  { id: '#9a15d', nome: 'Brandon Glover', telefone: '55 (95) 9732-5436', email: 'brandon.g@hotmail.com', uf: 'Blumenau - SC', cadastro: '09/01/2022', source: 'REFERRAL', clienteDesde: '2022', ultimaCompra: '20 dias' },
  { id: '#76c37', nome: 'Toni Li', telefone: '55 (93) 2382-8559', email: 'toni.li@gmail.com', uf: 'Salvador - BA', cadastro: '25/11/2023', source: 'APP', clienteDesde: '2023', ultimaCompra: '30 dias' },
  { id: '#0131c', nome: 'Barbara Luna', telefone: '55 (82) 3045-0948', email: 'barbara.luna@me.com', uf: 'Taubaté - SP', cadastro: '27/02/2016', source: 'REFERRAL', clienteDesde: '2016', ultimaCompra: '12 dias' },
  { id: '#1cf37', nome: 'Richard Benson', telefone: '55 (83) 5281-0372', email: 'rich.benson@gmail.com', uf: 'Lagoa da Prata - MG', cadastro: '08/04/2018', source: 'WEB', clienteDesde: '2018', ultimaCompra: '08 dias' },
  { id: '#10ddb', nome: 'James Alin', telefone: '55 (19) 7487-6994', email: 'james.alin@gmail.com', uf: 'Maceió - AL', cadastro: '05/03/2023', source: 'APP', clienteDesde: '2023', ultimaCompra: '45 dias' },
  // Página 2
  { id: '#03448', nome: 'Jennifer Morrison', telefone: '55 (89) 5482-6724', email: 'jennifer.m@gmail.com', uf: 'Parnamirim - RN', cadastro: '22/06/2014', source: 'REFERRAL', clienteDesde: '2014', ultimaCompra: '01 dia' },
  { id: '#1e682', nome: 'Tara Avila', telefone: '55 (88) 1951-7223', email: 'tara.avila@outlook.com', uf: 'Amélia Rodrigues - BA', cadastro: '08/01/2016', source: 'WEB', clienteDesde: '2016', ultimaCompra: '03 dias' },
  { id: '#7f18d', nome: 'Jessica Moreno', telefone: '55 (83) 4140-5757', email: 'jess.moreno@gmail.com', uf: 'Paragominas - PA', cadastro: '09/12/2023', source: 'WEB', clienteDesde: '2023', ultimaCompra: '07 dias' },
  { id: '#72cc5', nome: 'Elizabeth Jones', telefone: '55 (87) 2655-7918', email: 'liz.jones@gmail.com', uf: 'Passos - MG', cadastro: '07/08/2021', source: 'APP', clienteDesde: '2021', ultimaCompra: '02 dias' },
  { id: '#2fe28', nome: 'Tim Marshall', telefone: '55 (22) 8685-6959', email: 'tim.marshall@gmail.com', uf: 'Santa Bárbara - MG', cadastro: '18/02/2016', source: 'APP', clienteDesde: '2016', ultimaCompra: '04 dias' },
  { id: '#6c014', nome: 'Jason thompson', telefone: '55 (86) 0319-5667', email: 'jason.t@gmail.com', uf: 'Camaçari - BA', cadastro: '01/01/2014', source: 'WEB', clienteDesde: '2014', ultimaCompra: '06 dias' },
  { id: '#ce07f', nome: 'Tina Carter', telefone: '55 (87) 6706-3302', email: 'tina.carter@gmail.com', uf: 'Balsa Nova - PR', cadastro: '25/08/2021', source: 'WEB', clienteDesde: '2021', ultimaCompra: '09 dias' },
  { id: '#8a74f', nome: 'Tanya Mckay', telefone: '55 (81) 3754-7231', email: 'tanya.mckay@gmail.com', uf: 'Manaus - AM', cadastro: '06/07/2019', source: 'REFERRAL', clienteDesde: '2019', ultimaCompra: '11 dias' },
]

export const GET_MOCK_POR_PAGINA = (pagina: number) => {
  const start = (pagina - 1) * 9
  const end = start + 9
  return CLIENTES_MOCK_ALL.slice(start, end)
}
