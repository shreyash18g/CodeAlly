import { useEffect, useState } from "react";
import { getSubmissionHistory } from "../apis/auth";

export default function SubmissionHistory() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getSubmissionHistory();
      setSubs(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <div>
      <h1>Submission History</h1>

      {subs.map((s) => (
        <div key={s.id}>
          <p>ID: {s.id}</p>
          <p>Problem: {s.problemNumber}</p>
          <p>Verdict: {s.verdict}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}