/// <reference path="../definitions/three-pdbloader.d.ts" />
/// <reference path="../definitions/three-icosahedronbuffergeometry.d.ts" />
import {Component, OnInit, HostListener} from '@angular/core';
import {MoleculesService} from "../services/molecules.service";
import {EditorService} from "../services/editor.service";
import {ProjectService} from "../services/project.service";
//import * as THREE from 'three';

@Component({
    selector: 'visor',
    template: `
        <div id="canvas"></div>
    `
})
export class VisorComponent implements OnInit{
    private container: HTMLElement;
    private rootGroup: THREE.Group;
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;

    private width:number;
    private height:number;

    private mouseDown:boolean = false;
    private last: MouseEvent;

    constructor(private moleculesService:MoleculesService, private editorService:EditorService, private projectService:ProjectService){
        this.editorService.moleculeLoadSbj$.subscribe(
            molecule => {
                this.loadMolecule(molecule);
            });
    }


    @HostListener('mouseup')
    onMouseup() {
        this.mouseDown = false;
    }

    @HostListener('mousemove', ['$event'])
    onMousemove(event: MouseEvent) {
        if(this.mouseDown) {
            this.rootGroup.rotateX((this.last.clientX - event.clientX)/100);
            this.rootGroup.rotateY((this.last.clientY - event.clientY)/100);
            /*this.scene.rotate(
                event.clientX - this.last.clientX,
                event.clientY - this.last.clientY
            );*/
            this.last = event;
        }
    }

    @HostListener('mousedown', ['$event'])
    onMousedown(event:MouseEvent) {
        this.mouseDown = true;
        this.last = event;
    }

    ngOnInit(){
        this.container = document.getElementById('canvas');
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.scene = new THREE.Scene();

        this.camera = new THREE.OrthographicCamera(this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, 0.1, 2000);
        this.camera.position.set(0, 0, 1000);

        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha:true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x050505);
        //this.renderer.setClearColor(0xFFFFFF);

        this.container.appendChild(this.renderer.domElement);

        //Root Group
        this.rootGroup = new THREE.Group();
        this.scene.add( this.rootGroup );


        // Lights
        let light = new THREE.DirectionalLight( 0xffffff, 0.8 );
        light.position.set( 1, 1, 1 );
        this.scene.add( light );

        let light2 = new THREE.DirectionalLight( 0xffffff, 0.5 );
        light2.position.set( -1, -1, 1 );
        this.scene.add( light2 );


        this.animate();
        window.addEventListener('resize', _ => this.onResize());

        this.loadBackground();

        let molecules = this.projectService.getMolecules();
        for(let moleculeId of molecules){
            this.loadMolecule(moleculeId);
            return;
        }
    }

    private loadBackground(){
        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            '/dist/img/backgrounds/blood.jpg',
            (texture) => {
                let imgMaterial = new THREE.MeshBasicMaterial({
                    map: texture
                });
                let planeSize = this.calculateBackgroundSize(texture.image.naturalWidth, texture.image.naturalHeight)
                let plane = new THREE.Mesh(new THREE.PlaneGeometry(planeSize.width, planeSize.height), imgMaterial);
                plane.position.set(0, 0, -1000);

                this.scene.add(plane);
            }
        );
    }

    public animate() {
        window.requestAnimationFrame(_ => this.animate());
        /*

        this.stats.update();
        TWEEN.update();*/

        this.renderer.render(this.scene, this.camera);
    }

    public onResize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        //this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    loadMolecule(moleculeId:string){
        while ( this.rootGroup.children.length > 0 ) {
            let object = this.rootGroup.children[ 0 ];
            object.parent.remove( object );
        }

        let loader = new THREE.PDBLoader();
        loader.load(
            // resource URL
            'dist/models/'+moleculeId+'.pdb',
            // Function when resource is loaded
            ( geometry, geometryBonds, json ) => {
                //console.log( 'This molecule has ' + json.atoms.length + ' atoms' );
                this.parseMoleculeData(geometry, geometryBonds, json);
            },
            // Function called when download progresses
            function (  ) {
                //console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },
            // Function called when download errors
            function (  ) {
                console.log( 'An error happened' );
            }
        );
    }

    parseMoleculeData(geometry:any, geometryBonds:any, json:any){
        let lim:any = {
            minX:null,
            maxX:null,
            minY:null,
            maxY:null,
            minZ:null,
            maxZ:null
        };

        let boxGeometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
        let sphereGeometry = new THREE.IcosahedronBufferGeometry( 1, 2 );
        let offset = geometry.center();
        geometryBonds.translate( offset.x, offset.y, offset.z );
        let positions = geometry.getAttribute( 'position' );
        let colors = geometry.getAttribute( 'color' );
        let position = new THREE.Vector3();
        let color = new THREE.Color();

        for ( let i = 0; i < positions.count; i ++ ) {
            position.x = positions.getX( i );
            position.y = positions.getY( i );
            position.z = positions.getZ( i );

            if(position.x > lim.maxX || lim.maxX == null){
                lim.maxX = position.x;
            }
            if(position.x < lim.minX || lim.minX == null){
                lim.minX = position.x;
            }
            if(position.y > lim.maxY || lim.maxY == null){
                lim.maxY = position.y;
            }
            if(position.y < lim.minY || lim.minY == null){
                lim.minY = position.y;
            }
            if(position.z > lim.maxZ || lim.maxZ == null){
                lim.maxZ = position.z;
            }
            if(position.z < lim.minZ || lim.minZ == null){
                lim.minZ = position.z;
            }



            color.r = colors.getX( i );
            color.g = colors.getY( i );
            color.b = colors.getZ( i );
            //let element = geometry.elements[ i ];
            let material = new THREE.MeshPhongMaterial( {color:color.getHex()} );
            let object = new THREE.Mesh( sphereGeometry, material );
            object.position.copy( position );
            object.position.multiplyScalar( 75 );
            object.scale.multiplyScalar( 25 );
            this.rootGroup.add( object );
            //var atom = json.atoms[ i ];
            //var text = document.createElement( 'div' );
            //text.className = 'label';
            //text.style.color = 'rgb(' + atom[ 3 ][ 0 ] + ',' + atom[ 3 ][ 1 ] + ',' + atom[ 3 ][ 2 ] + ')';
            //text.textContent = atom[ 4 ];
            //var label = new THREE.CSS2DObject( text );
            //label.position.copy( object.position );
            //this.rootGroup.add( label );
        }

        positions = geometryBonds.getAttribute( 'position' );
        let start = new THREE.Vector3();
        let end = new THREE.Vector3();
        for ( let i = 0; i < positions.count; i += 2 ) {
            start.x = positions.getX( i );
            start.y = positions.getY( i );
            start.z = positions.getZ( i );
            end.x = positions.getX( i + 1 );
            end.y = positions.getY( i + 1 );
            end.z = positions.getZ( i + 1 );
            start.multiplyScalar( 75 );
            end.multiplyScalar( 75 );
            let object = new THREE.Mesh( boxGeometry, new THREE.MeshPhongMaterial( 0xffffff ) );
            object.position.copy( start );
            object.position.lerp( end, 0.5 );
            object.scale.set( 5, 5, start.distanceTo( end ) );
            object.lookAt( end );
            this.rootGroup.add( object );
        }
        //this.rootGroup.position.x -= 200;
    }

    private calculateBackgroundSize(imgWidth, imgHeight){
        if(this.height > this.width){
            return {
                width: this.height,
                height: this.height
            }
        }
        else{
            return {
                width: this.width,
                height: this.width
            }
        }
    }
}