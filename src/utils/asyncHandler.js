// Using async await wrapper functions
const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            res.status(error.code || 500).json({
                success: false,
                message: error.message
            })
        }
    }
}

// Using promise wrapper functions

const asyncHandlerOne = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => next(error))
    }
}



export { asyncHandler, asyncHandlerOne }