import React from 'react'

interface HeaderProps {
    name: string;
}

const Header = ({name}: HeaderProps) => {
    return (
        <h1 className="text-2xl font-semibold text-gray- ">
            {name}
        </h1>
    )
}

export default Header
