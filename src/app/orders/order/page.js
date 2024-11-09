'use client'

import dynamic from 'next/dynamic'

const DynamicToolProviderList = dynamic(() => import('@/app/component/order'), { ssr: false })

const Layout = () => {


  return <DynamicToolProviderList />
}

export default Layout