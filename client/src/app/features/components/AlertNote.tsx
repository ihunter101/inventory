const AlertNote = ({ text }: {text: string}) => {
    return <div className="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded p-3">
        {text}
    </div>
}
export default AlertNote;