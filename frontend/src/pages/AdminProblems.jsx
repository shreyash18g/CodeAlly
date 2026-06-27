import { useState } from "react";
import { createProblem } from "../apis/auth";

export default function AdminProblems() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(1);

  const handleCreate = async () => {
    try {

      await createProblem({
        title,
        description,
        difficulty,
        hiddenTestCases: [],
      });

      alert("Problem Created");

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <h1>Admin Problems</h1>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
      />

      <br />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) =>
          setDescription(e.target.value)
        }
      />

      <br />

      <input
        type="number"
        value={difficulty}
        onChange={(e) =>
          setDifficulty(Number(e.target.value))
        }
      />

      <br />

      <button onClick={handleCreate}>
        Create Problem
      </button>
    </div>
  );
}