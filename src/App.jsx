import { Canvas, useLoader, useFrame, extend, useThree } from '@react-three/fiber';
import { useState, useRef, useEffect, useMemo } from 'react';
import './App.css';
import { OrbitControls, Stats } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Raycaster, Vector2 } from 'three';

extend({ Raycaster });

function Model({ url, setHoveredObject }) {
  const gltf = useLoader(GLTFLoader, url);

  useEffect(() => {
    if (gltf) {
      console.log("Model hierarchy:");
      traverseHierarchy(gltf.scene, 0);
    }
  }, [gltf]);

  const traverseHierarchy = (node, level) => {
    const indent = ' '.repeat(level * 2);
    console.log(`${indent}${node.name || 'Unnamed node'} (${node.type})`);
    node.children.forEach(child => traverseHierarchy(child, level + 1));
  };

  return <primitive object={gltf.scene} />;
}

function App() {
  const [modelUrl, setModelUrl] = useState(null);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);

  const handleModelUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  };

  return (
    <>
      <Canvas camera={{ position: [-8, 5, 8] }}>
        <ambientLight intensity={0.5} />
        <directionalLight color="white" position={[5, 5, 5]} intensity={1} />
        <directionalLight color="white" position={[-5, -5, -5]} intensity={0.5} />
        <directionalLight color="white" position={[0, 5, 0]} intensity={0.5} />
        <directionalLight color="white" position={[0, -5, 0]} intensity={0.5} />
        {modelUrl && <Model url={modelUrl} setHoveredObject={setHoveredObject} />}
        <OrbitControls />
        <Stats className="stats-panel" />
        <HoverHighlight setHoveredObject={setHoveredObject} setSelectedObject={setSelectedObject} />
      </Canvas>
      <div className="upload-container">
        <input
          type="file"
          accept=".glb"
          onChange={handleModelUpload}
          className="upload-button"
        />
      </div>
      <div className="title">
        3D Model Viewer
      </div>
      {selectedObject && <ColorPanel selectedObject={selectedObject} />}
    </>
  );
}

function HoverHighlight({ setHoveredObject, setSelectedObject }) {
  const { gl, scene, camera } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const mouse = useRef(new Vector2());
  const previousHoveredObject = useRef(null);
  const originalColor = useRef(null);

  const onMouseMove = (event) => {
    mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  const onClick = (event) => {
    if (previousHoveredObject.current) {
      setSelectedObject(previousHoveredObject.current);
      console.log("Clicked Mesh:", previousHoveredObject.current.name);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
    };
  }, []);

  useFrame(() => {
    raycaster.setFromCamera(mouse.current, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      setHoveredObject(object);

      if (previousHoveredObject.current && previousHoveredObject.current !== object) {
        previousHoveredObject.current.material.emissive.set(originalColor.current);
      }

      if (object.material) {
        if (previousHoveredObject.current !== object) {
          originalColor.current = object.material.emissive.getHex();
          previousHoveredObject.current = object;
        }
        object.material.emissive.set(0xaaaaaa);
      }
    } else {
      if (previousHoveredObject.current) {
        previousHoveredObject.current.material.emissive.set(originalColor.current);
        previousHoveredObject.current = null;
        originalColor.current = null;
      }
      setHoveredObject(null);
    }
  });

  return null;
}

function ColorPanel({ selectedObject }) {
  const colors = [
    '#ff0000', // red
    '#00ff00', // green
    '#0000ff', // blue
    '#ffff00', // yellow
    '#ff00ff', // magenta
    '#00ffff', // cyan
    '#ffffff', // white
    '#000000', // black
  ];

  const handleColorChange = (color) => {
    if (selectedObject && selectedObject.material) {
      selectedObject.material.color.set(color);
    }
  };

  return (
    <div className="color-panel" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100 }}>
      <input type="color" style={{ display: 'none' }} />
      {colors.map((color, index) => (
        <div
          key={index}
          style={{
            backgroundColor: color,
            width: '20px',
            height: '20px',
            display: 'inline-block',
            cursor: 'pointer',
            border: '1px solid #000',
            margin: '2px',
          }}
          onClick={() => handleColorChange(color)}
        />
      ))}
    </div>
  );
}

export default App;
