import React from 'react'
import { Routes,Route} from 'react-router-dom'
import Amazon from './Amazon'
import { Login } from '../Page/Login'

export const MainRoutes = () => {
  return (
    <Routes>
<Route path='/login' element={<Login/>}/>
<Route path='/' element={<Amazon/>}/>
    </Routes>
  )
}
