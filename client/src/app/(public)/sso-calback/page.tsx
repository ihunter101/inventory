"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSORedirect(): JSX.Element {
    return <AuthenticateWithRedirectCallback />
}

