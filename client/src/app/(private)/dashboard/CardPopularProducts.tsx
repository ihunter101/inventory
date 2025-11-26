"use client"
import { ShoppingBagIcon } from "lucide-react";
import { useGetDashboardMetricsQuery } from "../../state/api";
import  Rating   from "../../(components)/Rating"




const CardPopularProducts = () => {

    const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();

    return (
        <div className="row-span-3 xl:row-span-6 bg-white shadow-md rounded-2xl pb-4 h-full flex flex-col
        ">
            {isLoading ? (
                <div className="m-5">Loading...</div>
            ) : (
                <>
                    <h3 className="text-lg font-semibold px-7 pt-5 pb-2">
                        Popular Products 
                    </h3>
                    <hr />
                    {/* horizontal Line */}
                    <div className="overflow-auto-y flex-1">
                        {dashboardMetrics?.popularProducts.map((product) => (
                            <div
                            key={product.productId}
                            className="flex items-center justify-between gap-3 px-5 py-7 border-b">
                                {/* Left Margin */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden-">
                                        {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-contain"
                                        />
                                            ): (
                                            <span className="text-[10px] text-slate-500 text-center px-1">No Image</span>
                                        )}
                                    </div>

                                        <div className="flex flex-col justify-between gap-1">
                                            <div className="font-bold text-gray-700">
                                                {product.name}
                                            </div>
                                            <div className="flex text-sm items-center">
                                                <span className="font-bold text-blue-500 text-xs">
                                                    ${product.price}
                                                </span>
                                                <span className="mx-2">|</span>
                                                <Rating rating={product.rating || 0} />
                                            </div>
                                        </div>
                                </div>

                                <div className="text-xs items-center flex">
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-600"> 
                                        <ShoppingBagIcon className="w-4 h-4"/>
                                        <span>
                                            {Math.round(product.stockQuantity / 100)}k issued
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default CardPopularProducts;