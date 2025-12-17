"use client"; 

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs'; 

export const useResendPurchaseOrder = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { getToken } = useAuth(); // Now valid due to "use client"

    const resendEmail = async (poId: string, poNumber: string, recipientEmail: string) => {
        setIsLoading(true);
        
        
        //  Retrieve the token using the template name configured in your Clerk dashboard
        const token = await getToken({ template: 'express_backend' }); 
        
        if (!token) {
            toast.error("Authentication failed. Please log in.");
            setIsLoading(false);
            return;
        }

        try {
            const EXPRESS_API_URL = "http://localhost:8000/purchase-orders/resend-email";

            const response = await fetch(EXPRESS_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Send the token
                },
                body: JSON.stringify({ poId, poNumber, recipientEmail }),
            });
            // ... rest of the fetch logic ...
        } finally {
            setIsLoading(false);
        }
    };
    return { resendEmail, isLoading };
};