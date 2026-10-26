/** Rendering-only grayscale; source files remain untouched. */
export function monochromeMaterial(THREE, parameters) {
  const material = new THREE.MeshBasicMaterial(parameters)
  material.userData.mediaGrayscale = 1
  material.onBeforeCompile = shader => {
    const uniform = { value: material.userData.mediaGrayscale }
    shader.uniforms.mediaGrayscale = uniform
    material.userData.mediaGrayscaleUniform = uniform
    shader.fragmentShader = 'uniform float mediaGrayscale;\n' + shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722))), mediaGrayscale);')
  }
  material.customProgramCacheKey = () => 'portfolio-monochrome-v2'
  return material
}
export function setMediaGrayscale(material, enabled) {
  material.userData.mediaGrayscale = enabled ? 1 : 0
  if (material.userData.mediaGrayscaleUniform) material.userData.mediaGrayscaleUniform.value = enabled ? 1 : 0
}
