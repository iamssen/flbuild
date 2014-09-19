# Layout

가능한 단순성을 유지하자.

핵심 기능들은 무엇인가?

- asdoc 에 대한 외부 링크 (좀 더 빠르게 문서를 이해할 수 있다)
- markdown (문서의 작성이 좀 더 쉬워진다)
- 코드에 중요하지 않은 데이터는 yaml로 뺀 다음 결합
- json index (우선 json 데이터로 떨군 다음에 mustache와 같은 template을 사용해서 문서를 작성하게 된다. 유동적 변화 가능...)

json 데이터 구조

- namespaces[name.space]
	- description:markdown
	- classes:[name.space:Class...]
	- methods:[name.space#method()...]
	- properties:[name.space#property...]
- classes[name.space:Class]
	- external: "http://asdoc/name/space/Class.html"
	- see:[...???]
		- name.space
		- name.space:Class
		- name.space:Class#property
		- http://url
	- description:markdown
	- metadatas:[]
	- inheritance:[name.space:Class...]
	- implements:[name.space:Interface...]
	- methods:[name.space:Class#method()...]
	- properties:[name.space:Class#property...]
	- constants:[name.space:Class#CONTANT...]
- properties[name.space:Class#property]
	- see:[...???]
	- description:markdown
	- type:name.space:Class
	- defaultValue:*
	- metadatas:[]
- methods[name.space:Class#method()]
	- see:[...???]
	- description:markdown
	- return 
		- type:name.space:Class
		- description:markdown
	- parameters
		- name
		- type:name.space:Class
		- defaultValue:*
		- description:markdown

## navigator

- 전체 열기 / 닫기
- 필터링 (검색하면 전체 열기 상태로 검색된다)
	
## list (navigator에 영향을 받는다)

- namespace (tree 최상단)
	- mvc context (namespace.yaml에 의한 작동으로 context로 판별되면 하위 namespace를 하나로 묶는다)
- class (namespace 하위에 위치한다)
	- icon
		- actionscript special
			- constants class
			- event class
		- access
			- public
			- internal

## content

- navigator
	- show / hide inherited members

- class info
	- name: public class ClassName
	- # inheritance : -> mx.core.UIComponent -> mx.core.FlexSprite -> flash.display.Sprite
	- # subclasses : name.space.SubClassName, name.space.SubClassName2
	- # implements : name.space.Interface, name.space.Interface2
	- description : markdown text...
	- see also : links

- members (기본 이름들만 보인다. 누르면 anchor tag를 타고 이동한다)
	- constants
		- [access] name : type
			- name.space.ClassName.name : type (inherited members의 경우는 이와 같이 보인다)
	- properties
		- [access] [readonly|writeonly] name : type
	- methods
		- [access] name(param:type, param:type) : return type
	- events
	- styles
	- effects
	

