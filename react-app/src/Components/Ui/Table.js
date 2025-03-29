import React from "react";

export default function Table({ users, editUserId, editedUser, onEdit, onChange, onSave }) {
  return (
    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr className="bg-gray-100 border-b">
          <th className="py-2 px-4 border">Username</th>
          <th className="py-2 px-4 border">Name</th>
          <th className="py-2 px-4 border">Surname</th>
          <th className="py-2 px-4 border">Email</th>
          <th className="py-2 px-4 border">Phone</th>
          <th className="py-2 px-4 border">Balance</th>
          <th className="py-2 px-4 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b">
            <td className="py-2 px-4 border">{user.username}</td>
            <td className="py-2 px-4 border">
              {editUserId === user.id ? (
                <input
                  type="text"
                  value={editedUser.name || ""}
                  onChange={(e) => onChange(e, "name")}
                  className="border p-1 w-full"
                />
              ) : (
                user.name
              )}
            </td>
            <td className="py-2 px-4 border">{user.surname}</td>
            <td className="py-2 px-4 border">{user.email}</td>
            <td className="py-2 px-4 border">
              {editUserId === user.id ? (
                <input
                  type="text"
                  value={editedUser.phone || ""}
                  onChange={(e) => onChange(e, "phone")}
                  className="border p-1 w-full"
                />
              ) : (
                user.phone
              )}
            </td>
            <td className="py-2 px-4 border">
              {editUserId === user.id ? (
                <input
                  type="number"
                  value={editedUser.balance || ""}
                  onChange={(e) => onChange(e, "balance")}
                  className="border p-1 w-full"
                />
              ) : (
                `$${user.balance}`
              )}
            </td>
            <td className="py-2 px-4 border">
              {editUserId === user.id ? (
                <button
                  onClick={onSave}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => onEdit(user)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
