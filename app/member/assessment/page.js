'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

const questions = [
  'ปวดข้อเข่าในขณะเดิน',
  'ข้อเข่าฝืดหลังตื่นนอน',
  'ข้อเข่ามีเสียงเมื่อขยับ',
  'มีข้อจำกัดในการขึ้นลงบันได',
  'มีบวม/กดเจ็บบริเวณข้อเข่า'
]

export default function AssessmentPage() {
  const [scores, setScores] = useState(Array(questions.length).fill(0))
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const handleChange = (index, value) => {
    const updated = [...scores]
    updated[index] = parseInt(value)
    setScores(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)

    // หากคุณต้องการส่งข้อมูลไป backend ให้ใช้ fetch ที่นี่
    // เช่น:
    // await fetch('/api/assessment', { method: 'POST', body: JSON.stringify(scores) })

    // ไปยังหน้าผลประเมิน
    router.push('/member/result')
  }

  const total = scores.reduce((sum, s) => sum + s, 0)

  return (
    <div style={{ fontFamily: 'Kanit, sans-serif', padding: '20px' }}>
      <h1>แบบประเมินข้อเข่าเสื่อม</h1>
      <form onSubmit={handleSubmit}>
        {questions.map((q, index) => (
          <div key={index} style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>{q}</label>
            <select
              value={scores[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              required
              style={{ padding: '8px', fontSize: '16px' }}
            >
              <option value="0">0 - ไม่มีอาการ</option>
              <option value="1">1 - อาการเล็กน้อย</option>
              <option value="2">2 - อาการปานกลาง</option>
              <option value="3">3 - อาการรุนแรง</option>
              <option value="4">4 - อาการรุนแรงมาก</option>
            </select>
          </div>
        ))}

        <button type="submit" style={buttonStyle}>ส่งแบบประเมิน</button>
      </form>

      {submitted && (
        <div style={summaryStyle}>
          <p>คะแนนรวม: {total} คะแนน</p>
        </div>
      )}
    </div>
  )
}

const buttonStyle = {
  backgroundColor: '#4CAF50',
  color: 'white',
  padding: '10px 20px',
  fontSize: '16px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
}

const summaryStyle = {
  marginTop: '30px',
  padding: '15px',
  backgroundColor: '#e3f2fd',
  border: '1px solid #90caf9',
  fontSize: '1.1em'
}
