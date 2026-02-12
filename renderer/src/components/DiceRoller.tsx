import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'

type FaceInfo = {
  normal: THREE.Vector3
  center: THREE.Vector3
  value: number
  label: string
}

type DiceKind = {
  id: string
  sides: number
  label: string
  color: string
  geometry: () => THREE.BufferGeometry
  labels?: string[]
  values?: number[]
}

const createD10Geometry = () => {
  const geometry = new THREE.BufferGeometry()
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []
  const ringVertices: THREE.Vector3[] = []

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2
    const z = i % 2 === 0 ? 0.3 : -0.3
    const vertex = new THREE.Vector3(Math.cos(angle), Math.sin(angle), z)
    vertices.push(vertex)
    ringVertices.push(vertex.clone())
  }
  const topIndex = vertices.push(new THREE.Vector3(0, 0, 1.0)) - 1
  const bottomIndex = vertices.push(new THREE.Vector3(0, 0, -1.0)) - 1

  for (let i = 0; i < 10; i += 1) {
    const next = (i + 1) % 10
    indices.push(topIndex, i, next)
    indices.push(bottomIndex, next, i)
  }

  const position: number[] = []
  indices.forEach((index) => {
    const vertex = vertices[index]
    position.push(vertex.x, vertex.y, vertex.z)
  })

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  geometry.computeVertexNormals()
  const scale = 0.75
  geometry.scale(scale, scale, scale)
  geometry.userData.d10 = {
    ring: ringVertices.map((vertex) => vertex.multiplyScalar(scale)),
    top: vertices[topIndex].clone().multiplyScalar(scale),
    bottom: vertices[bottomIndex].clone().multiplyScalar(scale)
  }
  return geometry
}

const createConvexShape = (geometry: THREE.BufferGeometry) => {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry
  const positions = nonIndexed.attributes.position
  const vertices: CANNON.Vec3[] = []
  const faces: number[][] = []
  const vertexMap = new Map<string, number>()

  const getIndex = (x: number, y: number, z: number) => {
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`
    const existing = vertexMap.get(key)
    if (existing !== undefined) return existing
    const index = vertices.length
    vertices.push(new CANNON.Vec3(x, y, z))
    vertexMap.set(key, index)
    return index
  }

  for (let i = 0; i < positions.count; i += 3) {
    const ax = positions.getX(i)
    const ay = positions.getY(i)
    const az = positions.getZ(i)
    const bx = positions.getX(i + 1)
    const by = positions.getY(i + 1)
    const bz = positions.getZ(i + 1)
    const cx = positions.getX(i + 2)
    const cy = positions.getY(i + 2)
    const cz = positions.getZ(i + 2)
    const aIndex = getIndex(ax, ay, az)
    const bIndex = getIndex(bx, by, bz)
    const cIndex = getIndex(cx, cy, cz)
    faces.push([aIndex, bIndex, cIndex])
  }

  if (vertices.length === 0 || faces.length === 0) {
    return null
  }

  const center = vertices.reduce((acc, v) => acc.vadd(v), new CANNON.Vec3())
  center.scale(1 / vertices.length, center)

  faces.forEach((face) => {
    const a = vertices[face[0]]
    const b = vertices[face[1]]
    const c = vertices[face[2]]
    const ab = b.vsub(a)
    const ac = c.vsub(a)
    const normal = ab.cross(ac)
    const toCenter = a.vsub(center)
    if (normal.dot(toCenter) < 0) {
      const temp = face[1]
      face[1] = face[2]
      face[2] = temp
    }
  })

  return new CANNON.ConvexPolyhedron({ vertices, faces })
}

const DICE_KINDS: DiceKind[] = [
  {
    id: 'd4',
    sides: 4,
    label: 'd4',
    color: '#f97316',
    geometry: () => new THREE.TetrahedronGeometry(0.7)
  },
  {
    id: 'd6',
    sides: 6,
    label: 'd6',
    color: '#f3f4f6',
    geometry: () => new THREE.BoxGeometry(1, 1, 1)
  },
  {
    id: 'd8',
    sides: 8,
    label: 'd8',
    color: '#60a5fa',
    geometry: () => new THREE.OctahedronGeometry(0.8)
  },
  {
    id: 'd10',
    sides: 10,
    label: 'd10',
    color: '#22c55e',
    geometry: () => createD10Geometry(),
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  {
    id: 'd12',
    sides: 12,
    label: 'd12',
    color: '#a855f7',
    geometry: () => new THREE.DodecahedronGeometry(0.8)
  },
  {
    id: 'd20',
    sides: 20,
    label: 'd20',
    color: '#f43f5e',
    geometry: () => new THREE.IcosahedronGeometry(0.85)
  },
  {
    id: 'd100',
    sides: 100,
    label: 'd100',
    color: '#38bdf8',
    geometry: () => createD10Geometry()
  }
]

function DiceRoller() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const diceMeshRef = useRef<THREE.Mesh[]>([])
  const diceBodyRef = useRef<CANNON.Body[]>([])
  const worldRef = useRef<CANNON.World | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const faceInfoRef = useRef<FaceInfo[][]>([])
  const activeDiceRef = useRef<DiceKind>(DICE_KINDS[1])
  const diceMaterialRef = useRef<CANNON.Material | null>(null)
  const floorMaterialRef = useRef<CANNON.Material | null>(null)
  const wallMaterialRef = useRef<CANNON.Material | null>(null)
  const rollingRef = useRef(false)
  const pendingResultRef = useRef<number | null>(null)
  const pendingRollRef = useRef<DiceKind | null>(null)
  const [activeDiceId, setActiveDiceId] = useState('d6')
  const [result, setResult] = useState<number | null>(null)

  const activeDice = useMemo(
    () => DICE_KINDS.find((die) => die.id === activeDiceId) || DICE_KINDS[1],
    [activeDiceId]
  )

  const activeDiceSet = useMemo(() => {
    if (activeDiceId !== 'd100') return [activeDice]
    return [
      {
        id: 'd10_tens',
        sides: 10,
        label: 'd10',
        color: '#38bdf8',
        geometry: () => createD10Geometry(),
        labels: ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90'],
        values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
      },
      {
        id: 'd10_ones',
        sides: 10,
        label: 'd10',
        color: '#22c55e',
        geometry: () => createD10Geometry(),
        labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      }
    ]
  }, [activeDiceId, activeDice])

  useEffect(() => {
    activeDiceRef.current = activeDice
  }, [activeDice])

  const createNumberTexture = (value: string) => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = 'rgba(17, 24, 39, 0.85)'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f9fafb'
    ctx.font = 'bold 64px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(value, size / 2, size / 2)
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  const buildFaceInfo = (geometry: THREE.BufferGeometry, sides: number, labels?: string[], values?: number[]) => {
    const d10Data = geometry.userData.d10 as
      | { ring: THREE.Vector3[]; top: THREE.Vector3; bottom: THREE.Vector3 }
      | undefined
    if (d10Data && sides === 10) {
      const faces = d10Data.ring.map((_, index) => {
        const next = (index + 1) % d10Data.ring.length
        const top = d10Data.top
        const bottom = d10Data.bottom
        const a = top
        const b = d10Data.ring[index]
        const c = d10Data.ring[next]
        const d = bottom
        const normal1 = b.clone().sub(a).cross(c.clone().sub(a))
        const normal2 = c.clone().sub(d).cross(b.clone().sub(d))
        const normal = normal1.add(normal2).normalize()
        const center = a.clone().add(b).add(c).add(d).multiplyScalar(0.25)
        const value = values?.[index] ?? index + 1
        const label = labels?.[index] ?? String(value)
        return { normal, center, value, label }
      })
      return faces
    }
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry
    const positions = nonIndexed.attributes.position
    const faceMap = new Map<string, { normal: THREE.Vector3; center: THREE.Vector3; count: number }>()
    const tempA = new THREE.Vector3()
    const tempB = new THREE.Vector3()
    const tempC = new THREE.Vector3()
    const tempNormal = new THREE.Vector3()

    for (let i = 0; i < positions.count; i += 3) {
      tempA.fromBufferAttribute(positions, i)
      tempB.fromBufferAttribute(positions, i + 1)
      tempC.fromBufferAttribute(positions, i + 2)
      tempNormal.copy(tempB).sub(tempA).cross(tempC.clone().sub(tempA)).normalize()
      const key = `${tempNormal.x.toFixed(2)},${tempNormal.y.toFixed(2)},${tempNormal.z.toFixed(2)}`
      const center = tempA.clone().add(tempB).add(tempC).divideScalar(3)
      const entry = faceMap.get(key)
      if (entry) {
        entry.center.add(center)
        entry.count += 1
      } else {
        faceMap.set(key, { normal: tempNormal.clone(), center, count: 1 })
      }
    }

    const faces = Array.from(faceMap.values()).map((entry) => ({
      normal: entry.normal,
      center: entry.center.divideScalar(entry.count)
    }))

    if (faces.length !== sides) {
      return [] as FaceInfo[]
    }

    faces.sort((a, b) => {
      if (b.normal.y !== a.normal.y) return b.normal.y - a.normal.y
      if (b.normal.x !== a.normal.x) return b.normal.x - a.normal.x
      return b.normal.z - a.normal.z
    })

    return faces.map((face, index) => {
      const value = values?.[index] ?? index + 1
      const label = labels?.[index] ?? String(value)
      return {
        ...face,
        value,
        label
      }
    })
  }

  const buildNumberedGeometry = (geometry: THREE.BufferGeometry, dice: DiceKind) => {
    const faces = buildFaceInfo(geometry, dice.sides, dice.labels, dice.values)
    if (faces.length !== dice.sides) {
      return { geometry, materials: null as THREE.Material[] | null, faces }
    }

    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry
    nonIndexed.clearGroups()
    const positions = nonIndexed.attributes.position
    const triangleCount = positions.count / 3
    const faceMaterials = faces.map((face) => {
      const texture = createNumberTexture(face.label)
      return new THREE.MeshStandardMaterial({
        map: texture || undefined,
        color: dice.color,
        roughness: 0.45,
        metalness: 0.15
      })
    })

    const tempA = new THREE.Vector3()
    const tempB = new THREE.Vector3()
    const tempC = new THREE.Vector3()
    const tempNormal = new THREE.Vector3()

    for (let i = 0; i < triangleCount; i += 1) {
      const offset = i * 3
      tempA.fromBufferAttribute(positions, offset)
      tempB.fromBufferAttribute(positions, offset + 1)
      tempC.fromBufferAttribute(positions, offset + 2)
      tempNormal.copy(tempB).sub(tempA).cross(tempC.clone().sub(tempA)).normalize()

      let bestIndex = 0
      let bestDot = -Infinity
      faces.forEach((face, faceIndex) => {
        const dot = tempNormal.dot(face.normal)
        if (dot > bestDot) {
          bestDot = dot
          bestIndex = faceIndex
        }
      })
      nonIndexed.addGroup(offset, 3, bestIndex)
    }

    return { geometry: nonIndexed, materials: faceMaterials, faces }
  }

  const clearFaceInfo = (index?: number) => {
    const targets = typeof index === 'number'
      ? [index]
      : faceInfoRef.current.map((_, i) => i)
    targets.forEach((idx) => {
      faceInfoRef.current[idx] = []
    })
  }


  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 4, 6)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    container.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(6, 8, 4)
    scene.add(directionalLight)

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: '#121527',
      roughness: 0.9,
      metalness: 0
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1
    scene.add(floor)

    const arenaMaterial = new THREE.MeshStandardMaterial({
      color: '#1f243a',
      roughness: 0.8,
      metalness: 0
    })
    const arenaSize = 3.6
    const arena = new THREE.Mesh(new THREE.BoxGeometry(arenaSize, 1.4, arenaSize), arenaMaterial)
    arena.position.set(0, -0.3, 0)
    arena.receiveShadow = true
    arena.material.side = THREE.BackSide
    scene.add(arena)

    const initialMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: '#f3f4f6', roughness: 0.4, metalness: 0.1 })
    )
    initialMesh.position.set(0, 1, 0)
    scene.add(initialMesh)
    diceMeshRef.current = [initialMesh]

    const world = new CANNON.World()
    world.gravity.set(0, -9.82, 0)
    world.allowSleep = true
    worldRef.current = world

    diceMaterialRef.current = new CANNON.Material('dice')
    floorMaterialRef.current = new CANNON.Material('floor')
    wallMaterialRef.current = new CANNON.Material('wall')

    world.addContactMaterial(
      new CANNON.ContactMaterial(floorMaterialRef.current, diceMaterialRef.current, {
        friction: 0.15,
        restitution: 0.25
      })
    )
    world.addContactMaterial(
      new CANNON.ContactMaterial(wallMaterialRef.current, diceMaterialRef.current, {
        friction: 0.05,
        restitution: 0.35
      })
    )
    world.addContactMaterial(
      new CANNON.ContactMaterial(diceMaterialRef.current, diceMaterialRef.current, {
        friction: 0.1,
        restitution: 0.2
      })
    )
    const diceBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
      material: diceMaterialRef.current || undefined,
      position: new CANNON.Vec3(0, 1, 0),
      sleepTimeLimit: 0.6,
      sleepSpeedLimit: 0.15
    })
    world.addBody(diceBody)
    diceBodyRef.current = [diceBody]

    const floorBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: floorMaterialRef.current || undefined
    })
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    floorBody.position.set(0, -1, 0)
    world.addBody(floorBody)

    const wallDistance = 1.6
    const walls = [
      { x: 0, z: -wallDistance, rotY: 0 },
      { x: 0, z: wallDistance, rotY: Math.PI },
      { x: wallDistance, z: 0, rotY: -Math.PI / 2 },
      { x: -wallDistance, z: 0, rotY: Math.PI / 2 }
    ]
    walls.forEach((wall) => {
      const wallBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        material: wallMaterialRef.current || undefined
      })
      wallBody.position.set(wall.x, -0.2, wall.z)
      wallBody.quaternion.setFromEuler(0, wall.rotY, 0)
      world.addBody(wallBody)
    })

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const clock = new THREE.Clock()
    let animationId = 0

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.02)
      world.step(1 / 60, delta, 3)

      diceMeshRef.current.forEach((mesh, idx) => {
        const body = diceBodyRef.current[idx]
        if (!body) return
        mesh.position.copy(body.position as unknown as THREE.Vector3)
        mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion)
      })

      if (rollingRef.current) {
        const allSleeping = diceBodyRef.current.length > 0 &&
          diceBodyRef.current.every((body) => body.sleepState === CANNON.Body.SLEEPING)
        if (allSleeping) {
          const up = new THREE.Vector3(0, 1, 0)
          const values: number[] = []
          diceMeshRef.current.forEach((mesh, idx) => {
            const faces = faceInfoRef.current[idx] || []
            if (faces.length === 0) return
            let bestDot = -Infinity
            let bestValue = 1
            faces.forEach((face) => {
              const worldNormal = face.normal.clone().applyQuaternion(mesh.quaternion)
              const dot = worldNormal.dot(up)
              if (dot > bestDot) {
                bestDot = dot
                bestValue = face.value
              }
            })
            values.push(bestValue)
          })

          if (values.length === diceMeshRef.current.length && values.length > 0) {
            if (activeDiceId === 'd100') {
              const tens = values[0] || 0
              const ones = values[1] || 0
              const computed = tens + ones
              setResult(computed === 0 ? 100 : computed)
            } else {
              setResult(values[0])
            }
          } else if (pendingResultRef.current !== null) {
            setResult(pendingResultRef.current)
          }

          rollingRef.current = false
          pendingResultRef.current = null
        }
      }

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      clearFaceInfo()
      renderer.dispose()
      scene.clear()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    const world = worldRef.current
    if (!scene || !world) return

    diceMeshRef.current.forEach((mesh) => {
      scene.remove(mesh)
      const geometry = mesh.geometry
      const material = mesh.material
      geometry.dispose()
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose())
      } else {
        material.dispose()
      }
    })

    diceBodyRef.current.forEach((body) => {
      world.removeBody(body)
    })

    diceMeshRef.current = []
    diceBodyRef.current = []
    clearFaceInfo()

    activeDiceSet.forEach((dice, index) => {
      const rawGeometry = dice.geometry()
      const { geometry, materials, faces } = buildNumberedGeometry(rawGeometry, dice)
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: dice.color,
        roughness: 0.45,
        metalness: 0.15
      })
      const diceMesh = new THREE.Mesh(geometry, materials || baseMaterial)
      diceMesh.position.set(index === 0 ? -0.4 : 0.4, 1, 0)
      scene.add(diceMesh)
      diceMeshRef.current.push(diceMesh)

      faceInfoRef.current[index] = faces

      const physicsShape = createConvexShape(geometry) || new CANNON.Sphere(0.55)

      const diceBody = new CANNON.Body({
        mass: 1,
        shape: physicsShape,
        material: diceMaterialRef.current || undefined,
        position: new CANNON.Vec3(index === 0 ? -0.4 : 0.4, 1, 0),
        sleepTimeLimit: 0.6,
        sleepSpeedLimit: 0.15
      })
      world.addBody(diceBody)
      diceBodyRef.current.push(diceBody)
    })

    if (pendingRollRef.current) {
      const next = pendingRollRef.current
      pendingRollRef.current = null
      applyRoll(next)
    }
  }, [activeDiceSet])

  const applyRoll = (dice: DiceKind) => {
    if (diceBodyRef.current.length === 0) return

    setResult(null)
    rollingRef.current = true
    const hasFaces = faceInfoRef.current.every((faces) => faces.length > 0)
    pendingResultRef.current = hasFaces ? null : Math.floor(Math.random() * dice.sides) + 1

    diceBodyRef.current.forEach((body, index) => {
      body.wakeUp()
      body.velocity.set(0, 0, 0)
      body.angularVelocity.set(0, 0, 0)
      body.linearDamping = 0.25
      body.angularDamping = 0.3
      body.position.set(index === 0 ? -0.35 : 0.35, 1, 0)
      body.quaternion.setFromEuler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)

      const impulse = new CANNON.Vec3(
        (Math.random() - 0.5) * 2.2,
        4.1 + Math.random() * 1.1,
        (Math.random() - 0.5) * 2.2
      )
      body.applyImpulse(impulse, body.position)
      body.angularVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10)
    })
  }

  const rollDice = (dice: DiceKind) => {
    if (dice.id !== activeDiceId) {
      pendingRollRef.current = dice
      setActiveDiceId(dice.id)
      return
    }
    applyRoll(dice)
  }

  return (
    <div className="dice-roller">
      <div className="dice-viewport" ref={containerRef} />
      <div className="dice-controls">
        <div className="dice-buttons">
          {DICE_KINDS.map((dice) => (
            <button
              key={dice.id}
              className="btn-secondary small"
              onClick={() => rollDice(dice)}
            >
              {dice.label}
            </button>
          ))}
        </div>
        <span className="dice-result">Resultado: {result ?? '-'}</span>
      </div>
    </div>
  )
}

export default DiceRoller
