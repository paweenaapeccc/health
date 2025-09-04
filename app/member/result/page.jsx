'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'

const ResultPage = () => {
  const params = useSearchParams()

  const scores = [1, 2, 3, 4, 5].map((i) =>
    parseInt(params.get(`q${i}`) || '0')
  )

  const assessments = [
    { topic: 'ปวดข้อเข่าในขณะเดิน', score: scores[0] },
    { topic: 'ข้อเข่าฝืดหลังตื่นนอน', score: scores[1] },
    { topic: 'ข้อเข่ามีเสียงเมื่อขยับ', score: scores[2] },
    { topic: 'มีข้อจำกัดในการขึ้นลงบันได', score: scores[3] },
    { topic: 'มีบวม/กดเจ็บบริเวณข้อเข่า', score: scores[4] }
  ]

  const getComment = (score) => {
    if (score >= 3) return 'รุนแรง'
    if (score === 2) return 'ปานกลาง'
    if (score === 1) return 'เล็กน้อย'
    return 'ไม่มีอาการ'
  }

  const getSeverity = (total) => {
    if (total >= 15) return 'รุนแรงมาก'
    if (total >= 10) return 'ปานกลาง'
    if (total >= 5) return 'เล็กน้อย'
    return 'ปกติ'
  }

  const totalScore = scores.reduce((sum, s) => sum + s, 0)
  const severity = getSeverity(totalScore)

  return (
    <div style={{ fontFamily: 'Kanit, sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>ผลการประเมินสุขภาพข้อเข่าเสื่อม</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px' }}>
        <thead>
          <tr>
            <th style={thStyle}>หัวข้อการประเมิน</th>
            <th style={thStyle}>คะแนน (0-4)</th>
            <th style={thStyle}>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((item, index) => (
            <tr key={index}>
              <td style={tdStyle}>{item.topic}</td>
              <td style={tdStyle}>{item.score}</td>
              <td style={tdStyle}>{getComment(item.score)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={summaryStyle}>
        คะแนนรวม: {totalScore} คะแนน — ระดับความรุนแรง: <strong>{severity}</strong>
      </div>
    </div>
  )
}

const thStyle = {
  border: '1px solid #ccc',
  padding: '12px',
  backgroundColor: '#e0e0e0',
  textAlign: 'center'
}

const tdStyle = {
  border: '1px solid #ccc',
  padding: '12px',
  textAlign: 'center'
}

const summaryStyle = {
  marginTop: '20px',
  padding: '15px',
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeeba',
  color: '#856404',
  fontSize: '1.1em'
}

export default ResultPage