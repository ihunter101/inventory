
import { Request, Response, NextFunction } from "express";


interface Bucket{
    tokens: number;
    lastRefill: number
}

/**
 * 
 * @param refill - Number of tokens added back to the buck each window
 * @param burst - The maximum number of tokens a bucket can hold
 * @param rate - The window duration in milliseconds (ms)
 */
 export default function tokenBucket(refill:number, burst: number, rate: number){
    const store = new Map();

    return (req: Request, res: Response, next: NextFunction) => {
        const key = req.ip
        const now = Date.now()

        let bucket = store.get(key)

        if (!bucket) {
            bucket = {
                tokens: burst,
                lastRefill: now
            };
            store.set(key, bucket)
        }

        //calculate how many disrecte time intervals has passed
        const intervalsElapsed = Math.floor((now - bucket.lastRefill) / rate);

        //add tokens back based on the intervals that has passed 
       if (intervalsElapsed > 0) {
        bucket.tokens = Math.min(
            burst, 
            bucket.tokens + (intervalsElapsed * refill)
        );
        bucket.lastRefill += intervalsElapsed * rate
       }

       //Check if we have enough tokens to refill the last request 
       if (bucket.tokens < 1) {
        const retryAfterMs = Math.max(0, (bucket.lastRefill + rate) - now);

        res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000 ))
        return res.status(429).json({
        error: "Too many requests",
        retryAfterMs,
      });
       }
       bucket.tokens -= 1
       next()

    }

}