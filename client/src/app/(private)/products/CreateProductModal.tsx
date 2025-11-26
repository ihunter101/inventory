import React, { ChangeEvent, FormEvent, useState } from 'react'
import { v4 } from 'uuid';
import Header from '../../(components)/Header';
import { UploadButton } from "@/utils/uploadthing";
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import "@uploadthing/react/styles.css";

type ProductFormData = {
    name: string; 
    price: number;
    stockQuantity: number;
    rating: number;
    imageUrl?: string;
}

type CreateProductModalProps = {
  isOpen: boolean;
    onClose: () => void;
    onCreate: (formData: ProductFormData) => void;
}

const CreateProductModal = ( { isOpen, onClose, onCreate }: CreateProductModalProps) => {
    const [formData, setFormData] = useState({
        productId: v4(),
        name: "",
        price: 0,
        stockQuantity: 0,
        rating: 0,
        imageUrl: "",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]:
                name === "price" ||  name === "stockQuantity" || name === "rating"
                ? parseFloat(value) 
                : value,
        });
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onCreate(formData);
        onClose()
    }
    if (!isOpen) return null 

    const labelCssStyles = 'block text-sm font-medium text-gray-700'
    const inputCssStyles = "block w-full mb-2 p-2 border-gray-500 border-2 rounded-md"
    
    return (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20'>
            <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
                <Header name="Create New Product" />
                <form onSubmit={handleSubmit} className='mt-5'>
                    {/* Product Name */}
                    <label htmlFor="productName" className= {labelCssStyles}>
                        Product Name
                    </label>
                    <input type="text" name="name"
                        placeholder='name'
                        onChange={handleChange}
                        value={formData.name}
                        className={inputCssStyles}
                        required 
                    />

                     {/* Price */}
                    <label htmlFor="productPrice" className= {labelCssStyles}>
                        Price
                    </label>
                    <input type="number" name="price"
                        placeholder='price'
                        onChange={handleChange}
                        value={formData.price}
                        className={inputCssStyles}
                        required 
                    />

                     {/* Quantity */}
                    <label htmlFor="stockQuntity" className= {labelCssStyles}>
                        Quantity in Stock
                    </label>
                    <input type="number" name="stockQuntity"
                        placeholder='Quantity'
                        onChange={handleChange}
                        value={formData.stockQuantity}
                        className={inputCssStyles}
                        required 
                    />

                     {/* Rating */}
                    <label htmlFor="rating" className= {labelCssStyles}>
                        Product Rating
                    </label>
                    <input type="number" name="rating"
                        placeholder='Rating'
                        onChange={handleChange}
                        value={formData.rating}
                        className={inputCssStyles}
                        required 
                    />

                     {/* Image  */}
                    <div className="mt-3 mb-4">
                        <p className={labelCssStyles}>Product Image</p>
                        <UploadButton
                            endpoint="imageUploader"
                            onClientUploadComplete={(res) => {
                                const file = res?.[0];
                                if (!file) return;

                                setFormData((prev) => ({
                                    ...prev,
                                    imageUrl: file.ufsUrl,
                                }))
                            }}onUploadError={(error: Error) => {
                                alert("Error uploading file: " + error.message);
                            }}
                        />
                        {formData.imageUrl && (
                            <p className="text-xs text-gray-500 mt-1 break-all">
                                Image selected ✔
                            </p>
                        )}
                    </div>

                    {/* Create Actions */}

                <button type='submit' className=' mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700'>
                    Create
                </button>

                <button 
                    onClick={onClose}
                    type='button' 
                    className=' ml-2 px-4 py-2 bg-grey-500 text-white rounded hover:bg-blue-700'
                >
                    Cancel
                </button>
                </form>
            </div>
        </div>
    )
}

export default CreateProductModal
